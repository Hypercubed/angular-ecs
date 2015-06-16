/**
 * angular-ecs - An ECS framework built for AngularJS
 * @version v0.0.20
 * @link https://github.com/Hypercubed/angular-ecs
 * @author Jayson Harshbarger <>
 * @license 
 */
/* global angular:true */

// main
'use strict';

(function () {

  'use strict';

  /**
  * ngdoc overview
  * name index
  *
  * description
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

    this.$get = ['$injector', function ($injector) {
      angular.forEach(map, function (value, key) {
        if (angular.isFunction(value)) {
          map[key] = $injector.invoke(value, null, null, key);
        }
      });
      return map;
    }];
  }

  angular.module('hc.ngEcs', [])

  /**
  * @ngdoc service
  * @name hc.ngEcs.$entities
  * @description
  * Index of {@link hc.ngEcs.Entity:entity entities}.
  **/
  .provider('$entities', MapProvider)

  /**
  * @ngdoc service
  * @name hc.ngEcs.$componentsProvider
  * @description
  * This provider allows component registration via the register method.
  *
  **/

  /**
  * @ngdoc
  * @name hc.ngEcs.$componentsProvider#$register
  * @methodOf hc.ngEcs.$componentsProvider
  *
  * @description
  * Registers a componnet during configuration phase
  *
  * @param {string|object} name Component name, or an object map of components where the keys are the names and the values are the constructors.
  * @param {function()|array} constructor Component constructor fn (optionally decorated with DI annotations in the array notation).
  */

  /**
  * @ngdoc service
  * @name hc.ngEcs.$components
  * @description
  * Index of components, components are object constructors
  * */
  .provider('$components', MapProvider)

  /**
  * @ngdoc service
  * @name hc.ngEcs.$systemsProvider
  * @description
  * This provider allows component registration via the register method.
  *
  **/

  /**
  * @ngdoc
  * @name hc.ngEcs.$systemsProvider#$register
  * @methodOf hc.ngEcs.$systemsProvider
  *
  * @description
  * Registers a componnet during configuration phase
  *
  * @param {string|object} name System name, or an object map of systems where the keys are the names and the values are the constructors.
  * @param {function()|array} constructor Component constructor fn (optionally decorated with DI annotations in the array notation).
  */

  /**
  * @ngdoc service
  * @name hc.ngEcs.$systems
  * @description
  * Index of systems, systems are generic objects
  * */
  .provider('$systems', MapProvider)

  /**
  * @ngdoc service
  * @name hc.ngEcs.$families
  * @description
  * Index of {@link hc.ngEcs.Family:family families}, a family is an array of game entities matching a list of required components.
  * */
  .provider('$families', MapProvider);
})();

// Entity
(function () {

  'use strict';

  angular.module('hc.ngEcs')

  /**
  * @ngdoc service
  * @name hc.ngEcs.Entity
  * @requires hc.ngEcs.$components
  * @description
  * {@link hc.ngEcs.Entity:entity Entity} factory..
  *
  * */

  .factory('Entity', ['$components', function ($components) {
    var _uuid = 0;
    function uuid() {
      var timestamp = new Date().getUTCMilliseconds();
      return '' + _uuid++ + '_' + timestamp;
    }

    /**
    * @ngdoc object
    * @name hc.ngEcs.Entity:entity
    * @description
    * An Entity is bag of game properties (components).  By convention properties that do not start with a $ or _ are considered compoenets.
    * */
    function Entity(id) {
      if (false === this instanceof Entity) {
        return new Entity(id);
      }
      this._id = id || uuid();

      this.$componentAdded = new signals.Signal();
      this.$componentRemoved = new signals.Signal();

      this.$$signals = {};
    }

    /**
    * @ngdoc
    * @name hc.ngEcs.Entity:entity#$on
    * @methodOf hc.ngEcs.Entity:entity
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
      var sig = this.$$signals[name];
      if (!sig) {
        this.$$signals[name] = sig = new signals.Signal();
      }
      return sig.add(listener, this);
    };

    /**
    * @ngdoc
    * @name hc.ngEcs.Entity:entity#$emit
    * @methodOf hc.ngEcs.Entity:entity
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
      var sig = this.$$signals[name];
      if (!sig) {
        return;
      } // throw error?

      if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        sig.dispatch.apply(sig, args);
      } else {
        sig.dispatch();
      }

      return this;
    };

    /**
      * @ngdoc
      * @name hc.ngEcs.Entity:entity#$add
      * @methodOf hc.ngEcs.Entity:entity
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
        return; // no emit
      }

      this[key] = createComponent(this, key, instance);

      this.$componentAdded.dispatch(this, key);
      return this;
    };

    function createComponent(e, name, state) {

      // not a registered component
      if (!$components.hasOwnProperty(name)) {
        return state;
      }

      var Type = $components[name];

      // not valid constructor
      if (!angular.isFunction(Type)) {
        throw new TypeError('Component constructor may only be an Object or function');
        return;
      }

      // already an instance
      if (state instanceof Type) {
        return state;
      }

      // inject
      if (Type.$inject) {
        return instantiate(Type, e, state);
      }

      return angular.extend(new Type(e), state);
    }

    function instantiate(Type, e, state) {
      var $inject = Type.$inject;

      var length = $inject.length,
          args = new Array(length),
          i;

      for (i = 0; i < length; ++i) {
        args[i] = getValue(e, $inject[i], state);
      }

      var instance = Object.create(Type.prototype || null);
      Type.apply(instance, args);
      return instance;
    }

    function getValue(e, key, state) {
      if (key === '$parent') {
        return e;
      }
      if (key === '$state') {
        return state;
      }
      //if (key === '$world') { return ngEcs; }  // todo
      return state[key];
    }

    function isComponent(name) {
      return name.charAt(0) !== '$' && name.charAt(0) !== '_';
    }

    /**
    * @ngdoc
    * @name hc.ngEcs.Entity:entity#$remove
    * @methodOf hc.ngEcs.Entity:entity
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
      // not a component by convention
      if (isComponent(key)) {
        this.$componentRemoved.dispatch(this, key);
      }
      delete this[key];
      return this;
    };

    return Entity;
  }]);
})();

// Entity
(function () {

  'use strict';

  /**
  * @ngdoc object
  * @name hc.ngEcs.Family:family
  * @description
  * A Family is array of game entities matching a list of required components.
  *
  **/

  function Family(require) {
    var _this = [];

    /**
    * @ngdoc
    * @name hc.ngEcs.Family:family#require
    * @propertyOf hc.ngEcs.Family:family
    *
    * @description
    * An array of component requirements of this family
    */
    Object.defineProperty(_this, 'require', {
      enumerable: false,
      writable: false,
      value: require
    });

    /**
    * @ngdoc
    * @name hc.ngEcs.Family#entityAdded
    * @propertyOf hc.ngEcs.Family:family
    *
    * @description
    * A signal dispatched when an entity is added
    */
    Object.defineProperty(_this, 'entityAdded', {
      enumerable: false,
      value: new signals.Signal()
    });

    /**
    * @ngdoc
    * @name hc.ngEcs.Family#entityRemoved
    * @propertyOf hc.ngEcs.Family:family
    *
    * @description
    * A signal dispatched when an entity is removed
    */
    Object.defineProperty(_this, 'entityRemoved', {
      enumerable: false,
      value: new signals.Signal()
    });

    for (var method in Family.prototype) {
      if (Family.prototype.hasOwnProperty(method)) {
        Object.defineProperty(_this, method, {
          enumerable: false,
          value: Family.prototype[method]
        });
      }
    }

    return _this;
  }

  /**
  * @ngdoc
  * @name hc.ngEcs.Family#isMatch
  * @methodOf hc.ngEcs.Family:family
  * @param {object} entity the entity to test match.
  * @returns {boolean} True if the entity matches this family
  *
  * @description
  * Tests if the entity matches the family requirements
  */
  Family.prototype.isMatch = function (entity) {
    if (!this.require) {
      return true;
    }

    return this.require.every(function (d) {
      return entity.hasOwnProperty(d);
    });
  };

  /**
  * @ngdoc
  * @name hc.ngEcs.Family#add
  * @methodOf hc.ngEcs.Family:family
  * @param {object} entity the entity to add.
  *
  * @description
  * Adds an entity to this family
  */
  Family.prototype.add = function (e) {
    // check if match?
    var index = this.indexOf(e);
    if (index < 0) {
      this.push(e);
      this.entityAdded.dispatch(e);
    }
  };

  /**
  * @ngdoc
  * @name hc.ngEcs.Family#addIfMatch
  * @methodOf hc.ngEcs.Family:family
  * @param {object} entity the entity to add if it matches the family requirements
  *
  * @description
  * Adds an entity to this family if entity matches requirements
  */
  Family.prototype.addIfMatch = function (e) {
    if (this.isMatch(e)) {
      this.add(e);
    }
  };

  /**
  * @ngdoc
  * @name hc.ngEcs.Family#remove
  * @methodOf hc.ngEcs.Family:family
  * @param {object} entity the entity to remove
  *
  * @description
  * Removes an entity from this family
  */
  Family.prototype.remove = function (e) {
    var index = this.indexOf(e);
    if (index > -1) {
      this.splice(index, 1);
      this.entityRemoved.dispatch(e);
    }
  };

  /**
  * @ngdoc
  * @name hc.ngEcs.Family#removeIfMatch
  * @methodOf hc.ngEcs.Family:family
  * @param {object} entity the entity to remove if it matches the family requirements
  *
  * @description
  * Removes an entity from this family if entity matches requirements
  */
  Family.prototype.removeIfMatch = function (e) {
    if (this.isMatch(e)) {
      this.remove(e);
    }
  };

  Family.makeId = function (require) {
    if (!require) {
      return '::';
    }
    if (typeof require === 'string') {
      return require;
    }
    return require.sort().join('::');
  };

  angular.module('hc.ngEcs')

  /**
  * @ngdoc object
  * @name hc.ngEcs.Family
  * @description
  * {@link hc.ngEcs.Family:family Family} factory.
  *
  * */
  .constant('Family', Family);
})();

/* global signals */

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
  .service('ngEcs', ['$rootScope', '$log', '$timeout', '$components', '$systems', '$entities', '$families', 'Entity', 'Family', function ($rootScope, $log, $timeout, $components, $systems, $entities, $families, Entity, Family) {

    var _uuid = 0;
    function uuid() {
      var timestamp = new Date().getUTCMilliseconds();
      return '' + _uuid++ + '_' + timestamp;
    }

    function Ecs(opts) {
      this.components = $components;
      this.systems = $systems;
      this.entities = $entities;
      this.families = $families;

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
      this.$requestId = null;
      this.$fps = 60;
      this.$interval = 1;
      //this.$systemsQueue = [];  // make $scenes?  Signal?

      this.started = new signals.Signal();
      this.stopped = new signals.Signal();

      this.updated = new signals.Signal();
      this.rendered = new signals.Signal();

      this.rendered.add(function () {
        $rootScope.$applyAsync();
      }, null, -1);

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
    Ecs.prototype.$c = function (key, constructor) {
      // perhaps add to $components
      if (typeof key !== 'string') {
        throw new TypeError('A components name is required');
      }
      return $components[key] = makeConstructor(key, constructor);
    };

    function makeConstructor(name, O) {

      if (angular.isArray(O)) {
        var T = O.pop();
        T.$inject = O;
        O = T;
      };

      if (angular.isFunction(O)) {
        return O;
      }

      if (typeof O !== 'object') {
        throw new TypeError('Component constructor may only be an Object or function');
      }

      var Constructor = new Function('return function ' + name + '( instance ){ angular.extend(this, instance); }')();

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
    Ecs.prototype.$f = function (require) {
      // perhaps add to $components
      var id = Family.makeId(require);
      var fam = $families[id];
      if (fam) {
        return fam;
      }
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
    Ecs.prototype.$s = function (key, system) {
      // perhaps add to $systems

      if (typeof key === 'object') {
        system = key;
        key = uuid();
      }

      $systems[key] = system; // todo: make a system class?  Error if already existing.

      var $priority = system.$priority || 0;

      system.$family = this.$f(system.$require); // todo: later only store id?

      if (system.$addEntity) {
        system.$family.entityAdded.add(system.$addEntity, system, $priority);
      }

      if (system.$removeEntity) {
        system.$family.entityRemoved.add(system.$removeEntity, system, $priority);
      }

      this.$$addSystem($systems[key]);

      return system;
    };

    Ecs.prototype.$$addSystem = function (system) {

      var $priority = system.$priority || 0;

      if (isDefined(system.$update)) {

        if (isDefined(system.interval)) {
          // add tests for interval
          system.acc = isDefined(system.acc) ? system.acc : 0;
          system.$$update = function (dt) {
            this.acc += dt;
            if (this.acc > this.interval) {
              if (system.$family.length > 0) {
                this.$update(this.interval);
              }
              this.acc = this.acc - this.interval;
            }
          };
        } else {
          system.$$update = function (dt) {
            // can be system prototype
            if (system.$family.length > 0) {
              this.$update(dt);
            }
          };
        }

        this.updated.add(system.$$update, system, $priority);
      }

      if (isDefined(system.$updateEach)) {
        system.$$updateEach = function (time) {
          // can be system prototype, bug: updateEach doesn't respect interval
          var arr = this.$family,
              i = arr.length;
          while (i--) {
            if (i in arr) {
              this.$updateEach(arr[i], time);
            }
          }
        };
        this.updated.add(system.$$updateEach, system, $priority);
      }

      if (isDefined(system.$render)) {
        this.rendered.add(system.$render, system, $priority);
      }

      if (isDefined(system.$renderEach)) {
        system.$$renderEach = function () {
          var arr = this.$family,
              i = arr.length;
          while (i--) {
            if (i in arr) {
              this.$renderEach(arr[i]);
            }
          }
        };
        this.rendered.add(system.$$renderEach, system);
      }

      if (isDefined(system.$started)) {
        this.started.add(system.$started, system, $priority);
      }

      if (isDefined(system.$stopped)) {
        this.stopped.add(system.$stopped, system, $priority);
      }

      if (isDefined(system.$added)) {
        system.$added();
      }

      return this;
    };

    Ecs.prototype.$$removeSystem = function (system) {
      // perhaps add to $systems

      if (typeof system === 'string') {
        system = $systems[key];
      }

      if (isDefined(system.$$update)) {
        this.updated.remove(system.$$update, system);
      }

      if (isDefined(system.$$updateEach)) {
        this.updated.remove(system.$$updateEach, system);
      }

      if (isDefined(system.$render)) {
        this.rendered.remove(system.$render, system);
      }

      if (isDefined(system.$$renderEach)) {
        this.rendered.remove(system.$$renderEach, system);
      }

      if (isDefined(system.$started)) {
        this.started.remove(system.$started, system);
      }

      if (isDefined(system.$stopped)) {
        this.stopped.remove(system.$stopped, system);
      }

      if (isDefined(system.$removed)) {
        system.$removed();
      }

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
      //var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }

      var e = new Entity(id);
      e.$world = this; // get rid of this

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

      e.$componentAdded.dispose();
      e.$componentRemoved.dispose();

      delete this.entities[e._id];

      return this;
    };

    function onFamilyAdded(family) {
      angular.forEach($entities, function (e) {
        family.addIfMatch(e);
      });
    }

    function onComponentAdded(entity, key) {
      angular.forEach($families, function (family) {
        if (family.require && key && family.require.indexOf(key) < 0) {
          return;
        }
        family.addIfMatch(entity);
      });
    }

    function onComponentRemoved(entity, key) {
      angular.forEach($families, function (family) {
        if (!family.require || key && family.require.indexOf(key) < 0) {
          return;
        }
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

      var self = this,
          now,
          last = window.performance.now(),
          dt = 0,
          DT = 0,
          step;

      function frame() {
        if (!self.$playing || self.$paused) {
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
      if (this.$playing) {
        return;
      }
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
      if (!this.$playing) {
        return;
      }
      this.$paused = true;
    };

    Ecs.prototype.$unpause = function () {
      if (!this.$playing || !this.$paused) {
        return;
      }
      this.$paused = false;
      this.$runLoop();
    };

    var TYPED_ARRAY_REGEXP = /^\[object (Uint8(Clamped)?)|(Uint16)|(Uint32)|(Int8)|(Int16)|(Int32)|(Float(32)|(64))Array\]$/;
    function isTypedArray(value) {
      return TYPED_ARRAY_REGEXP.test(Object.prototype.toString.call(value));
    }

    // deep copy objects removing $ props
    // must start with object,
    // skips keys that start with $
    // navigates down objects but not other times (including arrays)
    Ecs.prototype.$copyState = function ssCopy(src) {
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
  }]);
})();

// shims
(function () {
  'use strict';

  window.performance = window.performance || {};

  window.performance.now = (function () {
    return window.performance.now || window.performance.webkitNow || window.performance.msNow || window.performance.mozNow || Date.now || function () {
      return new Date().getTime();
    };
  })();

  window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
      return setTimeout(function () {
        var time = window.performance.now();
        callback(time);
      }, 16);
    };
  })();

  window.cancelAnimationFrame = (function () {
    return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || window.mozCancelAnimationFrame || function (id) {
      clearTimeout(id);
    };
  })();

  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          FNOP = function FNOP() {},
          fBound = function fBound() {
        return fToBind.apply(this instanceof FNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      FNOP.prototype = this.prototype;
      fBound.prototype = new FNOP();

      return fBound;
    };
  }
})();
//# sourceMappingURL=angular-ecs.js.map