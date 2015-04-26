/**
 * angular-ecs
 * @version v0.0.11 - 2015-04-26
 * @link https://github.com/Hypercubed/angular-ecs
 * @author Jayson Harshbarger <>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
// shims
(function () {
  'use strict';
  window.performance = window.performance || {};
  window.performance.now = function () {
    return window.performance.now || window.performance.webkitNow || window.performance.msNow || window.performance.mozNow || Date.now || function () {
      return new Date().getTime();
    };
  }();
  window.requestAnimationFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
      return setTimeout(function () {
        var time = window.performance.now();
        callback(time);
      }, 16);
    };
  }();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }
      var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, FNOP = function () {
        }, fBound = function () {
          return fToBind.apply(this instanceof FNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
      FNOP.prototype = this.prototype;
      fBound.prototype = new FNOP();
      return fBound;
    };
  }
}());
// main
(function () {
  'use strict';
  /**
  * @ngdoc overview
  * @name index
  *
  * @description
  * # An entity-component-system game framework made specifically for AngularJS.
  *
  * ## Why?
  *
  * There are many great game engines available for JavaScript.  Many include all the pieces needed to develop games in JavaScript; a canvas based rendering engine, optimized and specialized game loop, pixel asset management, dependency injection, and so on.  However, when developing a web game using AngularJS you may want to use only some parts of the game engine and leave other parts to Angular. To do this it often means playing tricks on the game engine to cooperate with angularjs. Angular-ecs is a entity-component-system built for and with AngularJS.  Angular-ecs was built to play nice with the angular architecture and to feel, as much as possible, like a native part of the angular framework.
  *
  *
  */
  function MapProvider() {
    var map = {};
    this.register = function (name, constructor) {
      if (angular.isObject(name)) {
        angular.extend(map, name);
      } else {
        map[name] = constructor;
      }
      return this;
    };
    this.$get = [
      '$injector',
      function ($injector) {
        angular.forEach(map, function (value, key) {
          if (angular.isFunction(value)) {
            map[key] = $injector.invoke(value, null, null, key);
          }
        });
        return map;
      }
    ];
  }
  angular.module('hc.ngEcs', []).provider('$entities', MapProvider).provider('$components', MapProvider).provider('$systems', MapProvider);
}());
// Entity
(function () {
  'use strict';
  angular.module('hc.ngEcs').factory('Entity', [
    '$components',
    function ($components) {
      var _uuid = 0;
      function uuid() {
        var timestamp = new Date().getUTCMilliseconds();
        return '' + _uuid++ + '_' + timestamp;
      }
      function Entity(id) {
        if (false === this instanceof Entity) {
          return new Entity(id);
        }
        this._id = id || uuid();
        this.$$listeners = {};
      }
      /**
    * @ngdoc
    * @name hc.ngEcs.Entity#$on
    * @methodOf hc.ngEcs.Entity
    *
    * @description
    * Adds an event listener to the entity
    *
    * @example
    * <pre>
      entity.$on('upgrade', function() {  });
    * </pre>
    * @param {string} name Event name to listen on.
    * @param {function(event, ...args)} listener Function to call when the event is emitted.
    * @returns {function()} Returns a deregistration function for this listener.
    */
      Entity.prototype.$on = function (name, listener) {
        var namedListeners = this.$$listeners[name];
        if (!namedListeners) {
          this.$$listeners[name] = namedListeners = [];
        }
        namedListeners.push(listener);
        var self = this;
        return function () {
          var indexOfListener = namedListeners.indexOf(listener);
          if (indexOfListener !== -1) {
            namedListeners[indexOfListener] = null;
          }
        };
      };
      /**
    * @ngdoc
    * @name hc.ngEcs.Entity#$emit
    * @methodOf hc.ngEcs.Entity
    *
    * @description
    * Dispatches an event `name` calling notifying
    * registered {@link hc.ngEcs.Entity#$on} listeners
    *
    * @example
    * <pre>
      entity.$emit('upgrade');
    * </pre>
    * @param {string} name Event name to emit.
    * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
    * @returns {Entity} The entity
    */
      Entity.prototype.$emit = function (name) {
        var empty = [], namedListeners, self = this, listenerArgs = Array.prototype.slice.call(arguments, 1), i, length;
        namedListeners = self.$$listeners[name] || empty;
        for (i = 0, length = namedListeners.length; i < length; i++) {
          namedListeners[i].apply(self, listenerArgs);
        }
        return this;
      };
      /**
      * @ngdoc
      * @name hc.ngEcs.Entity#$add
      * @methodOf hc.ngEcs.Entity
      *
      * @description
      * Adds a Component to the entity
      *
      * @example
      * <pre>
        entity.$add('position', {
          x: 1.0,
          y: 3.0
        });
      * </pre>
      * @param {string} key The name of the Component
      * @param {object} [instance] A component instance or a compoent configuration
      * @returns {Entity} The entity
      */
      Entity.prototype.$add = function (key, instance) {
        if (!key) {
          throw new Error('Can\'t add component with undefined key.');
        }
        // remove if exists
        if (this[key]) {
          this.$remove(key);
        }
        instance = angular.isDefined(instance) ? instance : {};
        // not a component by convention
        if (key.charAt(0) === '$' || key.charAt(0) === '_') {
          this[key] = instance;
          return;  // no emit
        }
        // is it a registered component?
        if ($components.hasOwnProperty(key)) {
          var Component = $components[key];
          if (typeof Component === 'function') {
            // constructor
            if (instance instanceof Component) {
              // already an instance
              this[key] = instance;
            } else {
              this[key] = new Component(this);
              angular.extend(this[key], instance);
            }
          } else {
            this[key] = angular.copy(Component);
            angular.extend(this[key], instance);
          }  //this[key].$parent = this;
        } else {
          this[key] = instance;
        }
        //this.$$eventEmitter.emit('add', this, key);
        this.$world.$onComponentAdd(this, key);
        return this;
      };
      /**
    * @ngdoc
    * @name hc.ngEcs.Entity#$remove
    * @methodOf hc.ngEcs.Entity
    *
    * @description
    * Removes a component from the entity
    *
    * @example
    * <pre>
      entity.$remove('position');
    * </pre>
    * @param {string} key The name of the Component
    * @returns {Entity} The entity
    */
      Entity.prototype.$remove = function (key) {
        delete this[key];
        // not a component by convention
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          //this.$$eventEmitter.emit('remove', this, key);
          this.$world.$onComponentRemove(this, key);
        }
        return this;
      };
      return Entity;
    }
  ]);
}());
// engine
(function () {
  'use strict';
  angular.module('hc.ngEcs').service('ngEcs', [
    '$rootScope',
    '$log',
    '$timeout',
    '$components',
    '$systems',
    '$entities',
    'Entity',
    function ($rootScope, $log, $timeout, $components, $systems, $entities, Entity) {
      function Ecs(opts) {
        this.components = $components;
        this.systems = $systems;
        this.entities = $entities;
        this.families = {};
        angular.forEach($systems, function (value, key) {
          // todo: test this
          this.$s(key, value);
        });
        angular.forEach($entities, function (value) {
          // todo: test this
          this.$e(value);
        });
        //this.$timer = null;
        this.$playing = false;
        //this.$delay = 1000;
        this.$fps = 60;
        this.$interval = 1;
        this.$systemsQueue = [];
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
    * @param {function|object} constructor component constructor or prototype
    */
      Ecs.prototype.$c = function (key, constructor) {
        // perhaps add to $components
        this.components[key] = constructor;
      };
      function getFamilyIdFromRequire(require) {
        if (!require) {
          return '::';
        }
        return require.join('::');
      }
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
      Ecs.prototype.$s = function (key, instance) {
        // perhaps add to $systems
        this.systems[key] = instance;
        this.$systemsQueue.unshift(instance);
        // todo: sort by priority, make scenes list
        var fid = getFamilyIdFromRequire(instance.$require);
        instance.$family = this.families[fid] = this.families[fid] || [];
        // todo: check existing entities ifany
        if (instance.$updateEach) {
          var _update = instance.$update ? instance.$update.bind(instance) : function () {
            };
          instance.$update = function (dt) {
            _update(dt);
            var i = -1, arr = this.$family, len = arr.length;
            while (++i < len) {
              instance.$updateEach(arr[i], dt);
            }
          };
        }
        if (angular.isDefined(instance.interval) && angular.isDefined(instance.$update)) {
          var __update = instance.$update.bind(instance);
          instance.acc = angular.isDefined(instance.acc) ? instance.acc : 0;
          instance.$update = function (dt) {
            this.acc += dt;
            if (this.acc > this.interval) {
              __update(dt);
              this.acc = this.acc - this.interval;
            }
          };
        }
        return instance;
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
        var self = this;
        if (typeof id === 'object') {
          instance = id;
          id = null;
        }
        var e = new Entity(id);
        e.$world = this;
        if (Array.isArray(instance)) {
          angular.forEach(instance, function (key) {
            e.$add(key);  //self.$onComponentAdd(e,key);
          });
        } else {
          angular.forEach(instance, function (value, key) {
            e.$add(key, value);  //self.$onComponentAdd(e,key);
          });
        }
        //e.$on('add', function(e,k) { self.$onComponentAdd(e,k); });
        //e.$on('remove', function(e,k) { self.$onComponentRemove(e,k); });
        this.entities[e._id] = e;
        return e;
      };
      function remove(arr, instance) {
        // maybe move to a class prototype?
        var index = arr.indexOf(instance);
        if (index > -1) {
          arr.splice(index, 1);
        }
      }
      function add(arr, instance) {
        var index = arr.indexOf(instance);
        if (index < 0) {
          arr.push(instance);
        }
      }
      Ecs.prototype.$$removeEntity = function (instance) {
        //var self = this;
        instance.$world = null;
        //instance.$off('add', this.$onComponentAdd);
        angular.forEach(instance, function (value, key) {
          if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
            instance.$remove(key);
          }
        });
        angular.forEach(this.families, function (family) {
          remove(family, instance);
        });
        //instance.$off('remove', this.$onComponentRemove);
        delete this.entities[instance._id];
      };
      function matchEntityToFamily(entity, require) {
        if (!require) {
          return true;
        }
        var fn = function (d) {
          return entity.hasOwnProperty(d);
        };
        return require.every(fn);
      }
      Ecs.prototype.$onComponentAdd = function (entity, key) {
        //$log.debug('$onComponentAdd', entity, key);
        angular.forEach(this.systems, function (system) {
          if (system.$require && system.$require.indexOf(key) < 0) {
            return;
          }
          if (!matchEntityToFamily(entity, system.$require)) {
            return;
          }
          add(system.$family, entity);
          if (system.$addEntity) {
            system.$addEntity(entity);
          }
        });
      };
      Ecs.prototype.$onComponentRemove = function (entity, key) {
        //$log.debug('$onComponentRemoved', entity, key);
        angular.forEach(this.systems, function (system) {
          if (!system.$require || system.$require.indexOf(key) < 0) {
            return;
          }
          if (system.$removeEntity) {
            system.$removeEntity(entity);
          }
          remove(system.$family, entity);
        });
      };
      /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$update
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Calls the update cycle
    */
      Ecs.prototype.$update = function (time) {
        time = angular.isUndefined(time) ? this.$interval : time;
        var arr = this.$systemsQueue, i = arr.length, system;
        while (i--) {
          system = arr[i];
          if (system.$update && system.$family.length > 0) {
            system.$update(time);
          }
        }
      };
      Ecs.prototype.$render = function (time) {
        time = angular.isUndefined(time) ? this.$interval : time;
        var arr = this.$systemsQueue, i = arr.length, system;
        while (i--) {
          system = arr[i];
          if (system.$render) {
            system.$render(time);
          }
        }
      };
      /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$start
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Starts the game loop
    */
      Ecs.prototype.$start = function () {
        if (this.$playing) {
          return;
        }
        this.$playing = true;
        var self = this, now, last = window.performance.now(), dt = 0, DT = 0, step;
        function frame() {
          if (!self.$playing) {
            return;
          }
          now = window.performance.now();
          DT = Math.min(1, (now - last) / 1000);
          dt = dt + DT;
          step = 1 / self.$fps;
          while (dt > step) {
            dt = dt - step;
            self.$update(step);
          }
          self.$render(DT);
          $rootScope.$apply();
          //$rootScope.$applyAsync(function() {
          //  self.$render(DT);
          //});
          last = now;
          window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
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
      };
      return new Ecs();
    }
  ]);
}());