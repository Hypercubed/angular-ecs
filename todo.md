# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

- [x] Switch to gulp
- [-] $world -> $engine?
- [ ] Finish component constructor function
  - [x] ngEcs.$c('position', ['x', 'y', Victor]);
  - [ ] make $world/$engine injectable
  - [x] Normalize components constructors on register
- [ ] Use babel? ES6 modules?  Inheritance for systems?
- [ ] Add ecs.$destroy function?
- [ ] ngECSProvider.config
- [ ] Maybe move engine methods to Providers ($entities.add(xxx), $systems.add(xxx), ...)
- [ ] Update Jasmine
- [ ] get render and renderEach to respect interval
- [ ] Use BoostArray?
- [ ] Make a System class
- [-] Serialization helper
  - [ ] ngEcs.$copyState
  - [-] ngEcs.$copyState(ngEcs.entities)
  - [-] ngEcs.$copyState(ngEcs.systems)
  - [ ] ngEcs.$copyState(ngEcs)
    - [ ] families -> $families
    - [ ] componentes -> $components
    - [ ] signals -> $signals
  - [ ]  tests
- [-] System priority
  - [ ] test
- [ ] Scene manager
- [x] Add $renderEach
- [x] Use signals for update and render?
- [x] Add tests for update, updateEach, render, renderEach
