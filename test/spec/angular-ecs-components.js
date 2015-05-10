'use strict';

describe('components', function () {

  var ngEcs, $components;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$components_){
    ngEcs = _ngEcs_;
    $components = _$components_;
  }));

  it('should create components', function () {
    ngEcs.$c('test', {});
    expect($components.test).toBeDefined();
    expect($components).toBe(ngEcs.components);
  });

  it('should create components using prototype', function () {
    ngEcs.$c('testComponent', {
      testing: 123,
      fn: jasmine.createSpy('callback')
    });
    var e = ngEcs.$e(['testComponent']);

    e.testComponent.fn();
    expect(e.testComponent.fn.calls.length).toBe(1);
    expect(typeof e.testComponent.fn).toBe('function');
    expect(e.testComponent.testing).toBe(123);
  });

  it('should create components using constructor', function () {
    var MockComponent = jasmine.createSpy('callback');

    ngEcs.$c('testComponent', MockComponent);
    var e = ngEcs.$e(['testComponent']);

    expect(MockComponent.calls.length).toBe(1);
    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.prototype === MockComponent.prototype);
  });

  it('should not call constructor if already an instance', function () {
    var MockComponent = jasmine.createSpy('callback');

    ngEcs.$c('testComponent', MockComponent);
    var e = ngEcs.$e({});
    e.$add('testComponent', new MockComponent());

    expect(MockComponent.calls.length).toBe(1);
    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.prototype === MockComponent.prototype);
  });

});
