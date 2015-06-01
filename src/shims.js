// shims
(function () {
  'use strict';

  window.performance = (window.performance || {});

  window.performance.now = (function () {
    return (
      window.performance.now ||
      window.performance.webkitNow ||
      window.performance.msNow ||
      window.performance.mozNow ||
      Date.now ||
      function () {
        return new Date().getTime();
      });
  })();

  window.requestAnimationFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        return setTimeout(function () {
          var time = window.performance.now();
          callback(time);
        }, 16);
      });
  })();

  window.cancelAnimationFrame = (function () {
    return (
      window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      function(id) {
        clearTimeout(id);
      });
  })();

  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          FNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof FNOP ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      FNOP.prototype = this.prototype;
      fBound.prototype = new FNOP();

      return fBound;
    };
  }

})();
