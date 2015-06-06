/* global spyOn */
/* global describe */
/* global beforeEach */
/* global it */
/* global jasmine */
/* global expect */
/* global xit */
/* global waitsFor */
/* global runs */

'use strict';

describe('module', function () {

  var ngEcs, $systems;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$systems_){
    ngEcs = _ngEcs_;
    $systems = _$systems_;

    ngEcs.$s('test', {
      $update: jasmine.createSpy('$update'),
      $updateEach: jasmine.createSpy('$updateEach'),
      $render: jasmine.createSpy('$render'),
      $renderEach: jasmine.createSpy('$renderEach')
    });

    ngEcs.$s('test2', {
      $require: ['test2'],
      $update: jasmine.createSpy('$update'),
      $updateEach: jasmine.createSpy('$updateEach'),
      $render: jasmine.createSpy('$render'),
      $renderEach: jasmine.createSpy('$renderEach')
    });

  }));

  it('should setup engine', function () {
    expect(ngEcs).toBeDefined();
    expect(ngEcs.components).toBeDefined();
    expect(ngEcs.systems).toBeDefined();
    expect(ngEcs.entities).toBeDefined();
  });

  it('should call update', function () {

    ngEcs.$e({ 'test3' :{} }); // needs and entity, with a component (fix this)
    ngEcs.$update();
    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update.calls.length).toBe(3);
    expect($systems.test2.$update.calls.length).toBe(0);
  });

  it('should call update and updateEach', function () {

    ngEcs.$e({ 'test' :{} }); // needs and entity, with a component (fix this)
    ngEcs.$e({ 'test' :{} }); // needs and entity, with a component (fix this)

    ngEcs.$update();
    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update.calls.length).toBe(3);
    expect($systems.test.$updateEach.calls.length).toBe(6);

    expect($systems.test2.$update.calls.length).toBe(0);
    expect($systems.test2.$updateEach.calls.length).toBe(0);
  });

  it('should call update and updateEach on each system', function () {

    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });

    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update.calls.length).toBe(2);
    expect($systems.test.$updateEach.calls.length).toBe(10);
    expect($systems.test2.$update.calls.length).toBe(2);
    expect($systems.test2.$updateEach.calls.length).toBe(6);
  });

  it('should call render and renderEach on each system', function () {

    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });

    ngEcs.$render();
    ngEcs.$render();

    expect($systems.test.$render.calls.length).toBe(2);
    expect($systems.test.$renderEach.calls.length).toBe(10);
    expect($systems.test2.$render.calls.length).toBe(2);
    expect($systems.test2.$renderEach.calls.length).toBe(6);
  });

  it('should run game loop', function (done) {

    runs(function() {
      ngEcs.$e({ 'test' :{} });
      ngEcs.$e({ 'test' :{} });
      ngEcs.$e({ 'test2' :{} });
      ngEcs.$e({ 'test2' :{} });
      ngEcs.$e({ 'test2' :{} });

      ngEcs.$start();
    });

    waitsFor(function() {
      if ($systems.test2.$render.calls.length === 4) {
        ngEcs.$stop();

        //expect($systems.test.$update.calls.length).toBe(4);
        //expect($systems.test.$updateEach.calls.length).toBe(20);
        //expect($systems.test2.$update.calls.length).toBe(4);
        //expect($systems.test2.$updateEach.calls.length).toBe(12);

        expect($systems.test.$render.calls.length).toBe(4);
        expect($systems.test.$renderEach.calls.length).toBe(20);
        expect($systems.test2.$render.calls.length).toBe(4);
        expect($systems.test2.$renderEach.calls.length).toBe(12);

        return true;
      }
      return false;
    }, 'Test', 1000);

  });

});
