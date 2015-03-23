# angular-ecs

An entity-component-system game framework made specifically for AngularJS.

There are many great game engines available for JavaScript.  Many include all the pieces needed to develop games in JavaScript; a canvas based rendering engine, optimized and specialized game loop, pixel asset management, dependency injection, and so on.  However, when developing a web game using AngularJS you may want to use only some parts of the game engine and leave other parts to Angular. To do this it often means playing tricks on the game engine to cooperate with angularjs. Angular-ecs is a entity-component-system built for and with AngularJS.  Angular-ecs was built to play nice with the angular architecture and to feel, as much as possible, like a native part of the angular framework.

** Watch out, a work in progress **

## Getting Started

Install using bower:

```
bower install --save Hypercubed/angular-ecs
```

## Design goals
- plays nice with AngularJS directives
- uses angular for DI
- take advantage of AngularJs tools
- easy to serialize entities
- feels like part of angular
- don't fight angular or JavaScript
- understand and take advantage of browser optimization

## Documentation
(coming soon)

## Examples
See: [Hypercubed/Epsilon-Prime](https://github.com/Hypercubed/Epsilon-Prime)

## Acknowledgements
Inspired by [darlingjs/darlingjs](https://github.com/darlingjs/darlingjs) and [brejep/ash-js](https://github.com/brejep/ash-js).

## License
MIT
