// Entity
(function() {

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

  .factory('Entity', function($components) {
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
      if(false === (this instanceof Entity)) {
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
    Entity.prototype.$on = function(name, listener) {
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
    Entity.prototype.$emit = function(name) {
      var sig = this.$$signals[name];
      if (!sig) {return;}  // throw error?

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
    Entity.prototype.$add = function(key, instance) {

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

      this[key] = createComponent(this, key, instance);

      this.$componentAdded.dispatch(this, key);
      return this;
    };

    function createComponent(e, key, instance) {

      if (!$components.hasOwnProperty(key)) {  // not a registered component
        return instance;
      }

      var Component = $components[key];

      if (angular.isFunction(Component)) {  // constructor
        if (instance instanceof Component) {  // already an instance
          return instance;
        } else {
          if (angular.isDefined(Component.$inject)) {
            return instantiate(Component, instance, e);
          } else {
            return angular.extend(new Component(e), instance);
          }
        }
      } else {                                // prototype
        return angular.copy(instance, Object.create(Component));
      }

    }

    function instantiate(Type, locals, e) {
      var $inject = Type.$inject;

      var args = [], i, length, key, arg;

      for (i = 0, length = $inject.length; i < length; i++) {
        key = $inject[i];  // todo: throw error if invalid

        arg = locals.hasOwnProperty(key)
          ? locals[key]
          : getService(key, e);

        args.push(arg);
      }

      var instance = Object.create(Type.prototype || null);
      Type.apply(instance, args);
      return instance;

    }

    function getService(key, caller) {
      if (key === '$parent') { return caller; }
      //if (key === '$world') { return ngEcs; }  // todo
      return undefined;
    }

    function isComponent(key) {
      return key.charAt(0) !== '$' && key.charAt(0) !== '_';
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
    Entity.prototype.$remove = function(key) {
      // not a component by convention
      if (isComponent(key)) {
        this.$componentRemoved.dispatch(this, key);
      }
      delete this[key];
      return this;
    };

    return Entity;
  });


})();
