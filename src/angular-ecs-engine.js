/* global MiniSignal, angular */

// engine
(function () {
  'use strict';

  angular.module('hc.ngEcs')

  /**
  * @ngdoc service
  * @name hc.ngEcs.ngEcs
  * @requires hc.ngEcs.$components
  * @requires hc.ngEcs.$systems
  * @requires hc.ngEcs.$entities
  * @requires hc.ngEcs.$families
  * @requires hc.ngEcs.Entity
  * @requires hc.ngEcs.Family
  * @description
  * ECS engine. Contain System, Components, and Entities.
  * */
  .service('ngEcs', function ($rootScope, $log, $timeout, $components, $systems, $entities, $families, Entity, Family) {
    var _uuid = 0;
    function uuid () {
      var timestamp = new Date().getUTCMilliseconds();
      return '' + _uuid++ + '_' + timestamp;
    }

    function Ecs (opts) {
      this.components = $components;
      this.systems = $systems;
      this.entities = $entities;
      this.families = $families;

      angular.forEach($systems, function (value, key) {  // todo: test this
        this.$s(key, value);
      });

      angular.forEach($entities, function (value) {  // todo: test this
        this.$e(value);
      });

      // this.$timer = null;
      this.$playing = false;
      // this.$delay = 1000;
      this.$requestId = null;
      this.$fps = 60;
      this.$interval = 1;
      // this.$systemsQueue = [];  // make $scenes?  Signal?

      /* this.started = new signals.Signal();
      this.stopped = new signals.Signal();

      this.updated = new signals.Signal();
      this.rendered = new signals.Signal(); */

      this.started = new MiniSignal();
      this.stopped = new MiniSignal();

      this.updated = new MiniSignal();
      this.rendered = new MiniSignal();

      this.beforeUpdate = new MiniSignal();
      this.afterUpdate = new MiniSignal();
      this.beforeRender = new MiniSignal();
      this.afterRender = new MiniSignal();

      this.afterRender.add(function () { $rootScope.$applyAsync(); });

      angular.extend(this, opts);
    }

    Ecs.prototype.constructor = Ecs;

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$c
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Adds a component contructor
    *
    * @param {string} key component key
    * @param {function|object|array} constructor Component constructor fn (optionally decorated with DI annotations in the array notation) or constructor prototype object
    */
    Ecs.prototype.$c = function (key, constructor) {  // perhaps add to $components
      if (typeof key !== 'string') {
        throw new TypeError('A components name is required');
      }
      $components[key] = makeConstructor(key, constructor);
      return $components[key];
    };

    function makeConstructor (name, O) {
      if (angular.isArray(O)) {
        var T = O.pop();
        T.$inject = O;
        O = T;
      }

      if (angular.isFunction(O)) { return O; }

      if (typeof O !== 'object') {
        throw new TypeError('Component constructor may only be an Object or function');
      }

      /* eslint-disable no-new-func */
      var Constructor = new Function(
        'return function ' + name + '( instance ){ angular.extend(this, instance); }'
      )();
      /* eslint-enable no-new-func */

      Constructor.prototype = O;
      Constructor.prototype.constructor = Constructor;
      Constructor.$inject = ['$state'];

      return Constructor;
    }

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$f
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Gets a family
    *
    * @param {string} require Array of component keys
    */
    Ecs.prototype.$f = function (require) {  // perhaps add to $components
      var id = Family.makeId(require);
      var fam = $families[id];
      if (fam) { return fam; }
      fam = $families[id] = new Family(require);
      onFamilyAdded(fam);

      return fam;
    };

    var isDefined = angular.isDefined;

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$s
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Adds a system
    *
    * @param {string} key system key
    * @param {object} instance system configuration
    */
    Ecs.prototype.$s = function (key, system) {  // perhaps add to $systems

      if (typeof key === 'object') {
        system = key;
        key = uuid();
      }

      $systems[key] = system;  // todo: make a system class?  Error if already existing.

      // var $priority = system.$priority || 0;

      system.$family = this.$f(system.$require);  // todo: later only store id?

      if (system.$addEntity) {
        system.$family.entityAdded.add(system.$addEntity, system);
      }

      if (system.$removeEntity) {
        system.$family.entityRemoved.add(system.$removeEntity, system);
      }

      this.$$addSystem($systems[key]);

      return system;
    };

    Ecs.prototype.$$addSystem = function (system) {
      // var $priority = system.$priority || 0;

      var _update = isDefined(system.$update);
      var _updateEach = isDefined(system.$updateEach);

      if (_update || _updateEach) {
        system.$$updateEach = _updateEach
        ? function (time) {
          var arr = system.$family;
          var i = arr.length;
          while (i--) {
            if (i in arr) {
              system.$updateEach(arr[i], time);
            }
          }
        }
        : angular.noop;  // noop should actually never be used

        var $$update;
        if (_updateEach && _update) {  // update and updateEach
          $$update = function (dt) {
            if (system.$family.length > 0) {
              system.$update(dt);
              system.$$updateEach(dt);
            }
          };
        } else if (_update) {          // only update
          $$update = function (dt) {
            if (system.$family.length > 0) {
              system.$update(dt);
            }
          };
        } else {                       // only updateEach
          $$update = system.$$updateEach;
        }

        if (isDefined(system.interval)) {  // add tests for interval
          system.acc = isDefined(system.acc) ? system.acc : 0;
          system.$$update = function (dt) {
            system.acc += dt;
            if (system.acc > system.interval) {
              $$update(system.interval);
              system.acc = system.acc - system.interval;
            }
          };
        } else {
          system.$$update = $$update;
        }

        system.$$updateBinding = this.updated.add(system.$$update, system);
      }

      if (isDefined(system.$render)) {
        system.$renderBinding = this.rendered.add(system.$render, system);
      }

      if (isDefined(system.$renderEach)) {
        system.$$renderEach = function () {
          var arr = system.$family;
          var i = arr.length;
          while (i--) {
            if (i in arr) {
              system.$renderEach(arr[i]);
            }
          }
        };
        system.$$renderEachBinding = this.rendered.add(system.$$renderEach, system);
      }

      if (isDefined(system.$started)) {
        system.$startedBinding = this.started.add(system.$started, system);
      }

      if (isDefined(system.$stopped)) {
        system.$stoppedBinding = this.stopped.add(system.$stopped, system);
      }

      if (isDefined(system.$added)) {
        system.$added();
      }

      return this;
    };

    Ecs.prototype.$$removeSystem = function (system) {  // perhaps add to $systems

      if (typeof system === 'string') {
        system = $systems[system];
      }

      if (isDefined(system.$$updateBinding)) system.$$updateBinding.detach();
      if (isDefined(system.$renderBinding)) system.$renderBinding.detach();
      if (isDefined(system.$$renderEachBinding)) system.$$renderEachBinding.detach();
      if (isDefined(system.$startedBinding)) system.$startedBinding.detach();
      if (isDefined(system.$stoppedBinding)) system.$stoppedBinding.remove();

      if (isDefined(system.$removed)) system.$removed();

      return this;
    };

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$e
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Creates and adds an Entity
    * @see Entity
    *
    * @example
    * <pre>
      //config as array
      ngEcs.$e('player', ['position','control','collision']);

      //or config as object
      ngEcs.$e('player', {
        position: { x: 0, y: 50 },
        control: {}
        collision: {}
      });
    * </pre>
    *
    * @param {string} id (optional) entity id
    * @param {object|array} instance (optional) config object of entity
    * @return {Entity} The Entity
    */
    Ecs.prototype.$e = function (id, instance) {
      // var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }

      var e = new Entity(id);
      e.$world = this;  // get rid of this

      if (Array.isArray(instance)) {
        instance.forEach(function (key) {
          e.$add(key);
        });
      } else {
        angular.forEach(instance, function (value, key) {
          e.$add(key, value);
        });
      }

      onComponentAdded(e);

      e.$componentAdded.add(onComponentAdded, this);
      e.$componentRemoved.add(onComponentRemoved, this);

      $entities[e._id] = e;

      return e;
    };

    Ecs.prototype.$$removeEntity = function (e) {
      e.$world = null;

      angular.forEach(e, function (value, key) {
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          e.$remove(key);
        }
      });

      angular.forEach($families, function (family) {
        family.remove(e);
      });

      e.$componentAdded.detachAll();
      e.$componentRemoved.detachAll();

      delete this.entities[e._id];

      return this;
    };

    function onFamilyAdded (family) {
      angular.forEach($entities, function (e) {
        family.addIfMatch(e);
      });
    }

    function onComponentAdded (entity, key) {
      angular.forEach($families, function (family) {
        if (family.require && key && family.require.indexOf(key) < 0) { return; }
        family.addIfMatch(entity);
      });
    }

    function onComponentRemoved (entity, key) {
      angular.forEach($families, function (family) {
        if (!family.require || (key && family.require.indexOf(key) < 0)) { return; }
        family.removeIfMatch(entity);
      });
    }

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$update
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Calls the update cycle
    */
    Ecs.prototype.$update = function (time) {
      this.updated.dispatch(time || this.$interval);
    };

    Ecs.prototype.$render = function (time) {
      this.rendered.dispatch(time || this.$interval);
    };

    Ecs.prototype.$runLoop = function () {
      window.cancelAnimationFrame(this.$requestId);

      var self = this;
      var last = window.performance.now();
      var dt = 0;
      var DT = 0;
      var now, step;

      function frame () {
        if (!self.$playing || self.$paused) { return; }

        now = window.performance.now();
        DT = Math.min(1, (now - last) / 1000);
        dt = dt + DT;
        step = 1 / self.$fps;

        self.beforeUpdate.dispatch();
        while (dt > step) {
          dt = dt - step;
          self.$update(step);
        }
        self.afterUpdate.dispatch();

        self.beforeRender.dispatch();
        self.$render(DT);
        self.afterRender.dispatch();

        last = now;
        self.$requestId = window.requestAnimationFrame(frame);
      }

      self.$requestId = window.requestAnimationFrame(frame);
    };

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$start
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Starts the game loop
    */
    Ecs.prototype.$start = function () {
      if (this.$playing) { return; }
      this.$playing = true;

      this.started.dispatch();
      this.$runLoop();
    };

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$stop
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Stops the game loop
    */
    Ecs.prototype.$stop = function () {
      this.$playing = false;
      window.cancelAnimationFrame(this.$requestId);
      this.stopped.dispatch();
    };

    Ecs.prototype.$pause = function () {
      if (!this.$playing) { return; }
      this.$paused = true;
    };

    Ecs.prototype.$unpause = function () {
      if (!this.$playing || !this.$paused) { return; }
      this.$paused = false;
      this.$runLoop();
    };

    var TYPED_ARRAY_REGEXP = /^\[object (Uint8(Clamped)?)|(Uint16)|(Uint32)|(Int8)|(Int16)|(Int32)|(Float(32)|(64))Array\]$/;
    function isTypedArray (value) {
      return TYPED_ARRAY_REGEXP.test(Object.prototype.toString.call(value));
    }

    // deep copy objects removing $ props
    // must start with object,
    // skips keys that start with $
    // navigates down objects but not other times (including arrays)
    Ecs.prototype.$copyState = function ssCopy (src) {
      var dst = {};
      for (var key in src) {
        if (src.hasOwnProperty(key) && key.charAt(0) !== '$') {
          var s = src[key];
          if (angular.isObject(s) && !isTypedArray(s) && !angular.isArray(s) && !angular.isDate(s)) {
            dst[key] = ssCopy(s);
          } else if (typeof s !== 'function') {
            dst[key] = s;
          }
        }
      }
      return dst;
    };

    return new Ecs();
  });
})();
