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
    var c = ngEcs.$c('test', {});

    expect($components.test).toBeDefined();
    expect($components.test).toBe(c);
    expect($components).toBe(ngEcs.components);
  });

  it('should convert objects to constructor', function () {
    var p = {};
    var c = ngEcs.$c('test', p);

    expect(typeof c).toBe('function');
    expect(c.prototype).toBe(p);
    expect(c.$inject).toEqual(['$state']);
  });

  it('should create components using prototype', function () {
    var c = ngEcs.$c('testComponent', {
      testing: 123,
      fn: jasmine.createSpy('callback')
    });
    var e = ngEcs.$e(['testComponent']);

    e.testComponent.fn();
    expect(e.testComponent.fn.calls.length).toBe(1);
    expect(typeof e.testComponent.fn).toBe('function');
    expect(e.testComponent.testing).toBe(123);

    expect(e.testComponent instanceof c);
  });

  it('should create components using constructor', function () {
    var MockComponent = jasmine.createSpy('callback');

    var c = ngEcs.$c('testComponent', MockComponent);
    var e = ngEcs.$e(['testComponent']);

    expect(MockComponent.calls.length).toBe(1);
    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.prototype === MockComponent.prototype);
    expect(e.testComponent instanceof c);
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

  it('should create components with state', function () {
    var MockComponent = jasmine.createSpy('callback');

    ngEcs.$c('testComponent', MockComponent);

    var e = ngEcs.$e({
      testComponent:  {
        x: 1,
        y: 2,
        z: 3
      }
    });

    expect(MockComponent.calls.length).toBe(1);
    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.prototype === MockComponent.prototype);
    expect(e.testComponent.x).toBe(1);
    expect(e.testComponent.y).toBe(2);
    expect(e.testComponent.z).toBe(3);
  });

  it('should create injectable components', function () {
    var MockComponent = function(x,y) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = null;
    };
    MockComponent.$inject = ['x','y'];

    ngEcs.$c('testComponent', MockComponent);

    var e = ngEcs.$e({
      testComponent:  {
        x: 1,
        y: 2,
        z: 3
      }
    });

    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.x).toBe(1);
    expect(e.testComponent.y).toBe(2);
    expect(e.testComponent.z).toBe(null);
  });

  it('should create injectable components with inline notation', function () {
    var MockComponent = function(x,y) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = null;
    };

    ngEcs.$c('testComponent', ['x','y', MockComponent]);

    var e = ngEcs.$e({
      testComponent:  {
        x: 1,
        y: 2,
        z: 3
      }
    });

    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.x).toBe(1);
    expect(e.testComponent.y).toBe(2);
    expect(e.testComponent.z).toBe(null);
  });

  it('should create injectable components with defaults', function () {
    var MockComponent = function(x,y) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = null;
    };
    MockComponent.$inject = ['x','y'];

    ngEcs.$c('testComponent', MockComponent);

    var e = ngEcs.$e(['testComponent']);

    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.x).toBe(0);
    expect(e.testComponent.y).toBe(0);
    expect(e.testComponent.z).toBe(null);
  });

  it('should create injectable parent', function () {
    var MockComponent = function(x,y,$parent) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = null;
      this.$parent = $parent;
    };
    MockComponent.$inject = ['x','y','$parent'];

    ngEcs.$c('testComponent', MockComponent);

    var e = ngEcs.$e({
      testComponent:  {
        x: 1,
        y: 2,
        z: 3
      }
    });

    expect(e.testComponent instanceof MockComponent);
    expect(e.testComponent.x).toBe(1);
    expect(e.testComponent.y).toBe(2);
    expect(e.testComponent.z).toBe(null);
    expect(e.testComponent.$parent).toBe(e);
  });

});
