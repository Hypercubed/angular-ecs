(function () {
  'use strict';
  var MapProvider = function () {
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
  };
  angular.module('hc.ngEcs', ['hc.thirdParty']).config([
    'thirdPartyProvider',
    function (thirdPartyProvider) {
      thirdPartyProvider.register('EventEmitter2');
    }
  ]).factory('Entity', [
    'EventEmitter2',
    '$components',
    function (EventEmitter2, $components) {
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
        this.$$eventEmitter = new EventEmitter2();
      }
      // add a component, key, instance, constructor
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
              this[key] = new Component();
              angular.extend(this[key], instance);
            }
          } else {
            this[key] = angular.copy(Component);
            angular.extend(this[key], instance);
          }
          this[key].$parent = this;
        } else {
          this[key] = instance;
        }
        this.$$eventEmitter.emit('add', this, key);
      };
      Entity.prototype.$remove = function (key) {
        delete this[key];
        // not a component by convention
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          this.$$eventEmitter.emit('remove', this, key);
        }
      };
      Entity.prototype.$on = function () {
        this.$$eventEmitter.on.apply(this.$$eventEmitter, arguments);
        return this;
      };
      Entity.prototype.$off = function () {
        this.$$eventEmitter.off.apply(this.$$eventEmitter, arguments);
        return this;
      };
      Entity.prototype.$emit = function () {
        this.$$eventEmitter.emit.apply(this.$$eventEmitter, arguments);
        return this;
      };
      return Entity;
    }
  ]).provider('$components', MapProvider).provider('$systems', MapProvider).provider('$entities', MapProvider).service('ngEcs', function (EcsFactory) {
    return new EcsFactory();
  }).factory('EcsFactory', function ($log, $timeout, $components, $systems, $entities, Entity) {
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
      this.$timer = null;
      this.$playing = false;
      this.$delay = 1000;
      this.$interval = 1;
      this.$systemsQueue = [];
      angular.extend(this, opts);
    }
    Ecs.prototype.constructor = Ecs;
    Ecs.prototype.$c = function (key, instance) {
      // perhaps add to $components
      this.components[key] = instance;
    };
    function getFamilyIdFromRequire(require) {
      if (!require) {
        return '::';
      }
      return require.join('::');
    }
    Ecs.prototype.$s = function (key, instance) {
      // perhaps add to $systems
      this.systems[key] = instance;
      this.$systemsQueue.unshift(instance);
      // todo: sort by priority
      var fid = getFamilyIdFromRequire(instance.$require);
      instance.$family = this.families[fid] = this.families[fid] || [];
    };
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
          e.$add(key);
          self.$onComponentAdd(e, key);
        });
      } else {
        angular.forEach(instance, function (value, key) {
          e.$add(key, value);
          self.$onComponentAdd(e, key);
        });
      }
      e.$on('add', function (e, k) {
        self.$onComponentAdd(e, k);
      });
      e.$on('remove', function (e, k) {
        self.$onComponentRemove(e, k);
      });
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
      instance.$off('add', this.$onComponentAdd);
      angular.forEach(instance, function (value, key) {
        if (key.charAt(0) !== '$' && key.charAt(0) !== '_') {
          instance.$remove(key);
        }
      });
      angular.forEach(this.families, function (family) {
        remove(family, instance);
      });
      instance.$off('remove', this.$onComponentRemove);
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
    Ecs.prototype.$update = function (time) {
      var self = this;
      time = angular.isUndefined(time) ? self.$interval : time;
      var i = this.$systemsQueue.length, system;
      while (i--) {
        system = this.$systemsQueue[i];
        if (system.$update && system.$family.length > 0) {
          system.$update(time);
        }
      }  //this.$systemsQueue.forEach(function(system) {   // todo: sort by priority
         //  if (system.$update && system.$family.length > 0) {
         //    system.$update(time);
         //  }
         //});
    };
    Ecs.prototype.$start = function () {
      if (this.$playing) {
        return;
      }
      var self = this;
      self.$playing = true;
      function tick() {
        //console.log('tick', self);
        self.$update(self.$interval);
        self.$timer = $timeout(tick, self.$delay);
      }
      tick();
    };
    Ecs.prototype.$stop = function () {
      this.$playing = false;
      if (this.$timer) {
        $timeout.cancel(this.$timer);
      }
    };
    return Ecs;
  });
}());