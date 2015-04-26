'use strict';

describe('entities', function () {

  var ngEcs, $entities;

  var MockComponent, callback;

  function EventComponent(_e) {
    _e.$on('call', callback);
  }

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$entities_){
    ngEcs = _ngEcs_;
    $entities = _$entities_;

    MockComponent = jasmine.createSpy('callback');
    callback = jasmine.createSpy('callback');

    ngEcs.$c('mockComponent', MockComponent);
    ngEcs.$c('eventComponent', EventComponent);
  }));

  it('should start empty', function () {
    expect(ngEcs.entities).toBe($entities);
    expect(Object.keys($entities).length).toBe(0);
  });

  it('should create entities', function () {
    var e = ngEcs.$e();
    expect(Object.keys($entities).length).toBe(1);
    expect($entities[e._id]).toBe(e);
  });

  it('should create entities with id', function () {
    var e = ngEcs.$e('e1');
    expect(Object.keys(ngEcs.entities).length).toBe(1);
    expect($entities.e1).toBe(e);
  });

  it('should delete entities', function () {
    var e = ngEcs.$e();
    ngEcs.$$removeEntity(e);

    expect(Object.keys($entities).length).toBe(0);
    expect($entities[e._id]).toBeUndefined();
  });

  it('should create entities with component using array', function () {
    var e = ngEcs.$e(['comp','comp2']);
    expect(e.comp).toBeDefined();
    expect(e.comp2).toBeDefined();
  });

  it('should create entities with components using map', function () {
    var e = ngEcs.$e({ comp: { x: 1 }, comp2: { y: 2 } });
    expect(e.comp).toBeDefined();
    expect(e.comp2).toBeDefined();
    expect(e.comp.x).toBe(1);
    expect(e.comp2.y).toBe(2);
  });

  it('should add components', function () {
    var e = ngEcs.$e();

    e.$add('comp', { x: 1 });
    e.$add('comp2', { y: 2 });

    expect(e.comp).toBeDefined();
    expect(e.comp2).toBeDefined();
    expect(e.comp.x).toBe(1);
    expect(e.comp2.y).toBe(2);
  });

  it('should throw exception on add undefined component', function() {
    var e = ngEcs.$e();
    expect(function() {
      e.$add();
    }).toThrow();
  });

  /* it('should invoke callbacks on add', function () {
    var e = ngEcs.$e();

    var called = [];
    e.$on('add', function(_e,k) {
      expect(_e).toBe(e);
      called.push(k);
    });

    e.$add('comp');
    e.$add('comp2');

    expect(called).toEqual(['comp','comp2']);
  }); */

  /* it('should not invoke callbacks for non-components on add', function () {
    var e = ngEcs.$e();

    var called = [];
    e.$on('add', function(_e,k) {
      expect(_e).toBe(e);
      called.push(k);
    });

    e.$add('comp');
    e.$add('comp2');
    e.$add('_comp');
    e.$add('$comp');

    expect(called).toEqual(['comp','comp2']);
    expect(e.comp).toBeDefined();
    expect(e._comp).toBeDefined();
    expect(e.$comp).toBeDefined();
  }); */

  it('should remove components', function () {
    var e = ngEcs.$e();

    e.$add('comp', { x: 1 });
    e.$add('comp2', { y: 2 });
    e.$remove('comp');

    expect(e.comp).toBeUndefined();
    expect(e.comp2).toBeDefined();
    expect(e.comp2.y).toBe(2);
  });

  /* it('should invoke callbacks on remove', function () {
    var e = ngEcs.$e();

    var called = [];
    e.$on('remove', function(_e,k) {
      expect(_e).toBe(e);
      called.push(k);
    });

    e.$add('comp');
    e.$add('comp2');
    e.$remove('comp');

    expect(called).toEqual(['comp']);
  }); */

  /* it('should not invoke callbacks for non-components on remove', function () {
    var e = ngEcs.$e();

    var called = [];
    e.$on('remove', function(_e,k) {
      expect(_e).toBe(e);
      called.push(k);
    });

    e.$add('comp');
    e.$add('comp2');
    e.$add('_comp');
    e.$add('$comp');
    e.$remove('comp');
    e.$remove('$comp');
    e.$remove('_comp');

    expect(called).toEqual(['comp']);
  }); */

  it('should be able to add and emit events', function () {

    var e = ngEcs.$e();

    e.$on('call',callback);

    e.$emit('call', 'arg1');
    e.$emit('call', 'arg2', 'arg3');

    expect(callback).toHaveBeenCalledWith('arg1');
    expect(callback).toHaveBeenCalledWith('arg2','arg3');

  });

  it('should pass entity to constructor', function () {

    var e = ngEcs.$e();

    e.$add('mockComponent');

    expect(MockComponent.calls.length).toBe(1);
    expect(MockComponent).toHaveBeenCalledWith(e);
    expect(e.mockComponent instanceof MockComponent);
    expect(e.mockComponent.prototype === MockComponent.prototype);
  });

  it('should be able to add events in constructor', function () {

    var e = ngEcs.$e(['eventComponent']);

    e.$emit('call');
    e.$emit('call');

    expect(callback.calls.length).toBe(2);
    expect(e.eventComponent instanceof EventComponent);
    expect(e.eventComponent.prototype === EventComponent.prototype);
  });

});
