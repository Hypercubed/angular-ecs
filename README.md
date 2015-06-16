# angular-ecs

[![Join the chat at https://gitter.im/Hypercubed/angular-ecs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Hypercubed/angular-ecs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An entity-component-system game framework made specifically for AngularJS.

> "Make Games, Not Engines" - Everyone

> "But I..." - Me

There are many great game engines available for JavaScript.  Many include all the pieces needed to develop games in JavaScript; a canvas based rendering engine, optimized and specialized game loop, pixel asset management, dependency injection, and so on.  However, when developing a web game using AngularJS you may want to use only some parts of the game engine and leave other parts to Angular. To do this it often means playing tricks on the game engine to cooperate with angularjs. Angular-ecs is a entity-component-system built for and with AngularJS.  Angular-ecs was built to play nice with the angular architecture and to feel, as much as possible, like a native part of the angular framework.

**Watch out, a work in progress**

## Getting Started

Install using bower:

```
bower install --save Hypercubed/angular-ecs
```

## Design goals
- plays nice with AngularJS services and directives
- uses angular for DI
- take advantage of AngularJs tools
- easy to serialize entities
- feels like part of angular
- don't fight angular or JavaScript
- understand and take advantage of browser optimization

## Documentation **WIP**

* [API](http://hypercubed.github.io/angular-ecs)
* [Getting Started](https://github.com/Hypercubed/angular-ecs/wiki)

## Examples

* [Hypercubed/Epsilon-Prime](https://github.com/Hypercubed/Epsilon-Prime)
* [Hypercubed/angular-ecs-flap](https://github.com/Hypercubed/angular-ecs-flap)
* [Hypercubed/angular-ecs-pong](https://github.com/Hypercubed/angular-ecs-pong)

## Acknowledgements
Inspired by [darlingjs/darlingjs](https://github.com/darlingjs/darlingjs) and [brejep/ash-js](https://github.com/brejep/ash-js) and many other great ECS implementations.

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) Jayson Harshbarger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
