/* global angular:true */

// main
(function() {

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

    this.register = function(name, constructor) {
      if (angular.isObject(name)) {
        angular.extend(map, name);
      } else {
        map[name] = constructor;
      }
      return this;
    };

    this.$get = ['$injector', function($injector) {
      angular.forEach(map, function(value, key) {
        if (angular.isFunction(value)) {
          map[key] = $injector.invoke(value, null, null, key);
        }
      });
      return map;
    }];

  }

  angular.module('hc.ngEcs',[])

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
