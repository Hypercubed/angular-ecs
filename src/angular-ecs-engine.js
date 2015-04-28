// engine
(function() {

  'use strict';

  angular.module('hc.ngEcs')

  /**
  * @ngdoc service
  * @name hc.ngEcs.ngEcs
  * @description
  * ECS engine. Contain System, Components, and Entities.
  * */
  .service('ngEcs', function($rootScope, $log, $timeout, $components, $systems, $entities, $families, Entity) {

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
      this.$fps = 60;
      this.$interval = 1;
      this.$systemsQueue = [];  // make $scenes?  Signal?

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

    function getFamilyIdFromRequire(require) {
      if (!require) { return '::'; }
      return require.join('::');  // perhaps sort ids?
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
    Ecs.prototype.$s = function(key, instance) {  // perhaps add to $systems
      $systems[key] = instance;

      this.$systemsQueue.unshift(instance);  // todo: sort by priority, make scenes list
      var fid = getFamilyIdFromRequire(instance.$require);
      instance.$family = this.families[fid] = this.families[fid] || [];
      // todo: check existing entities ifany

      if (instance.$updateEach) {
        var _update = (instance.$update) ? instance.$update.bind(instance) : function() {};
        instance.$update = function(dt) {
          _update(dt);
          var i = -1,arr = this.$family,len = arr.length;
          while (++i < len) {
            instance.$updateEach(arr[i],dt);
          }
        };
      }

      if (angular.isDefined(instance.interval) && angular.isDefined(instance.$update)) {
        var __update = instance.$update.bind(instance);
        instance.acc = angular.isDefined(instance.acc) ? instance.acc : 0;
        instance.$update = function(dt) {
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
    Ecs.prototype.$e = function(id, instance) {
      var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }

      var e = new Entity(id);
      e.$world = this;

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

    function remove(arr, instance) {  // maybe move to a class prototype?
      var index = arr.indexOf(instance);
      if (index > -1) {
        arr.splice(index,1);
      }
    }

    function add(arr, instance) {
      var index = arr.indexOf(instance);
      if (index < 0) {
        arr.push(instance);
      }
    }

    Ecs.prototype.$$removeEntity = function(instance) {
      //var self = this;

      instance.$world = null;

      //instance.$off('add', this.$onComponentAdd);

      angular.forEach(instance, function(value, key) {
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          instance.$remove(key);
        }
      });

      angular.forEach($families, function(family) {
        remove(family, instance);
      });

      //instance.$off('remove', this.$onComponentRemove);

      delete this.entities[instance._id];

    };

    function matchEntityToFamily(entity, require) {
      if (!require) {
        return true;
      }

      var fn = function(d) {
        return entity.hasOwnProperty(d);
      };
      return require.every(fn);
    }

    function onComponentAdded(entity, key) {
      //$log.debug('$onComponentAdd', entity, key);
      angular.forEach($systems, function(system) {

        if (system.$require && key && system.$require.indexOf(key) < 0) { return; }

        if (matchEntityToFamily(entity, system.$require))  {

          add(system.$family, entity);

          if (system.$addEntity) {
            system.$addEntity(entity);
          }

        }

      });
    }

    function onComponentRemoved(entity, key) {
      //$log.debug('$onComponentRemoved', entity, key);
      angular.forEach($systems, function(system) {

        if (!system.$require || (key && system.$require.indexOf(key) < 0)) { return; }

        if (matchEntityToFamily(entity, system.$require))  {

          if (system.$removeEntity) {
            system.$removeEntity(entity);
          }

          remove(system.$family, entity);

        }

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
      time = angular.isUndefined(time) ? this.$interval : time;
      var arr = this.$systemsQueue, i = arr.length, system;
      while(i--) {
        system = arr[i];
        if (system.$update && system.$family.length > 0) {
          system.$update(time);
        }
      }
    };

    Ecs.prototype.$render = function(time) {
      time = angular.isUndefined(time) ? this.$interval : time;
      var arr = this.$systemsQueue, i = arr.length, system;
      while(i--) {
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
    Ecs.prototype.$start = function() {
      if (this.$playing) { return; }
      this.$playing = true;

      var self = this,
        now,
        last = window.performance.now(),
        dt = 0,
        DT = 0,
        step;

      function frame() {
        if (!self.$playing) { return; }
        now = window.performance.now();
        DT = Math.min(1, (now - last) / 1000);
        dt = dt + DT;
        step = 1/self.$fps;
        while(dt > step) {
          dt = dt - step;
          self.$update(step);
        }
        //self.$render(DT);
        //$rootScope.$apply();
        $rootScope.$applyAsync(function() {
          self.$render(DT);
        });
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
    Ecs.prototype.$stop = function() {
      this.$playing = false;
    };

    return new Ecs();

  });

})();
