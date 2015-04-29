// Entity
(function() {

  'use strict';

  /**
  * @ngdoc service
  * @name hc.ngEcs.Family
  * @description
  * An Family is array of game entities matching a list of required components.
  * */
  function Family(require) {
    var _this = [];

    Object.defineProperty(_this, 'require', {
      enumerable: false,
      value: require
    });

    Object.defineProperty(_this, 'entityAdded', {
      enumerable: false,
      value: new signals.Signal()
    });

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

  Family.prototype.isMatch = function(entity) {
    if (!this.require) { return true; }

    return this.require.every(function(d) {
      return entity.hasOwnProperty(d);
    });
  };

  Family.prototype.add = function(e) {
    // check if match?
    var index = this.indexOf(e);
    if (index < 0) {
      this.push(e);
      this.entityAdded.dispatch(e);
    }
  };

  Family.prototype.addIfMatch = function(e) {
    if (this.isMatch(e)) {
      this.add(e);
    }
  };

  Family.prototype.remove = function(e) {
    var index = this.indexOf(e);
    if (index > -1) {
      this.splice(index,1);
      this.entityRemoved.dispatch(e);
    }
  };

  Family.prototype.removeIfMatch = function(e) {
    if (this.isMatch(e)) {
      this.remove(e);
    }
  };

  Family.makeId = function(require) {
    if (!require) { return '::'; }
    return require.sort().join('::');
  };

  angular.module('hc.ngEcs')
    .constant('Family', Family);


})();
