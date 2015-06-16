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

describe('engine', function () {

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

    //jasmine.Clock.useMock();

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

  it('should not call update and updateEach on removed systems', function () {

    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });

    ngEcs.$$removeSystem($systems.test2);

    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update.calls.length).toBe(2);
    expect($systems.test.$updateEach.calls.length).toBe(10);
    expect($systems.test2.$update.calls.length).toBe(0);
    expect($systems.test2.$updateEach.calls.length).toBe(0);
  });

  it('should call render and renderEach on each system', function () {

    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });

    ngEcs.$$removeSystem($systems.test2);

    ngEcs.$render();
    ngEcs.$render();

    expect($systems.test.$render.calls.length).toBe(2);
    expect($systems.test.$renderEach.calls.length).toBe(10);
    expect($systems.test2.$render.calls.length).toBe(0);
    expect($systems.test2.$renderEach.calls.length).toBe(0);
  });

  it('should not call render and renderEach on removed system', function () {

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

  xit('should run game loop', function (done) {

    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });
    ngEcs.$e({ 'test2' :{} });

    ngEcs.$start();

    jasmine.Clock.tick(1000/60*4);

    //console.log(1/ngEcs.$fps, $systems.test.$render.mostRecentCall.args[0], 1/60);

    /* expect($systems.test.$update.calls.length).toBe(4);
    expect($systems.test.$updateEach.calls.length).toBe(20);
    expect($systems.test2.$update.calls.length).toBe(4);
    expect($systems.test2.$updateEach.calls.length).toBe(12); */

    expect($systems.test.$render.calls.length).toBe(4);
    expect($systems.test.$renderEach.calls.length).toBe(20);
    expect($systems.test2.$render.calls.length).toBe(4);
    expect($systems.test2.$renderEach.calls.length).toBe(12);

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
      return ($systems.test2.$render.calls.length === 7);
    }, 'Test', 1000);

    runs(function() {
      expect($systems.test.$update.mostRecentCall.args[0]).toBe(1/ngEcs.$fps);
      expect($systems.test.$render.mostRecentCall.args[0]).toBeCloseTo(0.016);

      expect($systems.test.$update.calls.length).toBe(6);
      expect($systems.test.$updateEach.calls.length).toBe(30);
      expect($systems.test2.$update.calls.length).toBe(6);
      expect($systems.test2.$updateEach.calls.length).toBe(18);

      expect($systems.test.$render.calls.length).toBe(7);
      expect($systems.test.$renderEach.calls.length).toBe(5*7);
      expect($systems.test2.$render.calls.length).toBe(7);
      expect($systems.test2.$renderEach.calls.length).toBe(3*7);
    });

  });

  it('should run game loop, interval', function (done) {
    var sys;

    runs(function() {

      sys = ngEcs.$s('test3', {
        interval: 0.03,
        $update: jasmine.createSpy('$update'),
        $updateEach: jasmine.createSpy('$updateEach'),
        $render: jasmine.createSpy('$render'),
        $renderEach: jasmine.createSpy('$renderEach')
      });

      ngEcs.$e({ 'test' :{} });
      ngEcs.$e({ 'test' :{} });

      ngEcs.$start();
    });

    waitsFor(function() {
      if (sys.$render.calls.length === 5) {
        ngEcs.$stop();
        return true;
      }
      return false;
    }, 'Test', 1000);

    runs(function() {
      expect(sys.$update.mostRecentCall.args[0]).toBe(0.03);
      expect(sys.$render.mostRecentCall.args[0]).toBeCloseTo(0.016);

      expect(sys.$update.calls.length).toBe(2);
      //expect(sys.$updateEach.calls.length).toBe(5*0.016/0.04*2);  This is a bug, updateEach does not respect interval

      expect(sys.$render.calls.length).toBe(5);
      expect(sys.$renderEach.calls.length).toBe(2*5);
    });

  });

  it('should copy state', function () {

    var c = ngEcs.$copyState({
      x: 1,
      y: 2,
      $z: 3,
      _q: 4,
      r: function() {},
      s: {
        a: 1,
        $b: 2,
        _c: 3
      }
    });

    expect(c.x).toBe(1);
    expect(c.y).toBe(2);
    expect(c.$z).toBeUndefined();
    expect(c._q).toBe(4);
    expect(c.r).toBeUndefined();
    expect(c.s.a).toBe(1);
    expect(c.s.a).toBe(1);
    expect(c.s.$b).toBeUndefined();
    expect(c.s._c).toBe(3);
  });

});
