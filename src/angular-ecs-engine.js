/* global signals */

// engine
(function() {

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
  .service('ngEcs', function($rootScope, $log, $timeout, $components, $systems, $entities, $families, Entity, Family) {

    function Ecs(opts) {
      this.components = $components;
      this.systems = $systems;
      this.entities = $entities;
      this.families = $families;

      angular.forEach($systems, function(value, key) {  // todo: test this
        this.$s(key, value);
      });

      angular.forEach($entities, function(value) {  // todo: test this
        this.$e(value);
      });

      //this.$timer = null;
      this.$playing = false;
      //this.$delay = 1000;
      this.$requestId = null;
      this.$fps = 60;
      this.$interval = 1;
      //this.$systemsQueue = [];  // make $scenes?  Signal?

      this.started = new signals.Signal();
      this.stopped = new signals.Signal();

      this.updated = new signals.Signal();
      this.rendered = new signals.Signal();

      this.rendered.add(function() { $rootScope.$applyAsync(); }, null, 1000);

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
    Ecs.prototype.$c = function(key, constructor) {  // perhaps add to $components
      $components[key] = constructor;
    };

    /**
    * @ngdoc service
    * @name hc.ngEcs.ngEcs#$f
    * @methodOf hc.ngEcs.ngEcs
    *
    * @description Gets a family
    *
    * @param {string} require Array of component keys
    */
    Ecs.prototype.$f = function(require) {  // perhaps add to $components
      var id = Family.makeId(require);
      var fam = $families[id];
      if (fam) { return fam; }
      fam = $families[id] = new Family(require);

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
    Ecs.prototype.$s = function(key, system) {  // perhaps add to $systems
      $systems[key] = system;  // todo: make a system class?

      //this.$systemsQueue.unshift(system);  // todo: still needed?

      system.$family = this.$f(system.$require);  // todo: later only store id?

      if (system.$addEntity) {
        system.$family.entityAdded.add(system.$addEntity, system);
      }

      if (system.$removeEntity) {
        system.$family.entityRemoved.add(system.$removeEntity, system);
      }

      if (isDefined(system.$update)) {

        if (isDefined(system.interval)) {  // add tests for interval
          system.acc = isDefined(system.acc) ? system.acc : 0;
          system.$$update = function(dt) {
            this.acc += dt;
            if (this.acc > this.interval) {
              system.$family.length > 0 && this.$update(time);
              this.acc = this.acc - this.interval;
            }
          };
        } else {
          system.$$update = function(time) {  // can be system prototype
            system.$family.length > 0 && this.$update(time);
          };
        }

        this.updated.add(system.$$update, system);
      }

      if (isDefined(system.$updateEach)) {
        system.$$updateEach = function(time) {  // can be system prototype
          var arr = this.$family,i = arr.length;
          while (i--) {
            if (i in arr) {
              this.$updateEach(arr[i], time);
            }
          }
        };
        this.updated.add(system.$$updateEach, system);
      }

      if (isDefined(system.$render)) {
        this.rendered.add(system.$render, system);
      }

      if (isDefined(system.$renderEach)) {
        system.$$renderEach = function() {
          var arr = this.$family,i = arr.length;
          while (i--) {
            if (i in arr) {
              this.$renderEach(arr[i]);
            }
          }
        };
        this.rendered.add(system.$$renderEach, system);
      }

      if (isDefined(system.$started)) {
        this.started.add(system.$started, system);
      }

      if (isDefined(system.$stopped)) {
        this.stopped.add(system.$stopped, system);
      }

      if (isDefined(system.$added)) {
        system.$added();
      }

      return system;
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
    Ecs.prototype.$e = function(id, instance) {
      //var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }

      var e = new Entity(id);
      e.$world = this;  // get rid of this

      if (Array.isArray(instance)) {
        instance.forEach(function(key) {
          e.$add(key);
        });
      } else {
        angular.forEach(instance, function(value, key) {
          e.$add(key, value);
        });
      }

      onComponentAdded(e);

      e.$componentAdded.add(onComponentAdded, this);
      e.$componentRemoved.add(onComponentRemoved, this);

      $entities[e._id] = e;
      return e;
    };

    Ecs.prototype.$$removeEntity = function(e) {

      e.$world = null;

      angular.forEach(e, function(value, key) {
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          e.$remove(key);
        }
      });

      angular.forEach($families, function(family) {
        family.remove(e);
      });

      e.$componentAdded.dispose();
      e.$componentRemoved.dispose();

      delete this.entities[e._id];

    };

    function onComponentAdded(entity, key) {
      angular.forEach($families, function(family) {
        if (family.require && key && family.require.indexOf(key) < 0) { return; }
        family.addIfMatch(entity);
      });
    }

    function onComponentRemoved(entity, key) {
      angular.forEach($families, function(family) {
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
    Ecs.prototype.$update = function(time) {
      this.updated.dispatch(time || this.$interval);
    };

    Ecs.prototype.$render = function(time) {
      this.rendered.dispatch(time || this.$interval);
    };

    Ecs.prototype.$runLoop = function() {

      var self = this,
        now,
        last = window.performance.now(),
        dt = 0,
        DT = 0,
        step;

      function frame() {
        if (!self.$playing || self.$paused) { return; }
        now = window.performance.now();
        DT = Math.min(1, (now - last) / 1000);
        dt = dt + DT;
        step = 1/self.$fps;
        while(dt > step) {
          dt = dt - step;
          self.$update(step);
        }
        self.$render(DT);

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
    Ecs.prototype.$start = function() {
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
    Ecs.prototype.$stop = function() {
      this.$playing = false;
      window.cancelAnimationFrame(this.$requestId);
      this.stopped.dispatch();
    };

    Ecs.prototype.$pause = function() {
      if (!this.$playing) { return; }
      this.$paused = true;
    };

    Ecs.prototype.$unpause = function() {
      if (!this.$playing || !this.$paused) { return; }
      this.$paused = false;
      this.$runLoop();
    };

    return new Ecs();

  });

})();
