// Entity
(function() {

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
  Family.prototype.isMatch = function(entity) {
    if (!this.require) { return true; }

    return this.require.every(function(d) {
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
  Family.prototype.add = function(e) {
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
  Family.prototype.addIfMatch = function(e) {
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
  Family.prototype.remove = function(e) {
    var index = this.indexOf(e);
    if (index > -1) {
      this.splice(index,1);
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
  Family.prototype.removeIfMatch = function(e) {
    if (this.isMatch(e)) {
      this.remove(e);
    }
  };

  Family.makeId = function(require) {
    if (!require) { return '::'; }
    if (typeof require === 'string') { return require; }
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
