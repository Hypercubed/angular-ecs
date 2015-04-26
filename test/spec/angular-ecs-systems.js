'use strict';

describe('systems', function () {

  var ngEcs, $systems, $entities;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$systems_, _$entities_){
    ngEcs = _ngEcs_;
    $systems = _$systems_;
    $entities = _$entities_;
  }));

  it('should create systems', function () {
    ngEcs.$s('test', {});
    expect($systems.test).toBeDefined();
    expect($systems).toBe(ngEcs.systems);
  });

  it('should create systems and assign entities to families', function () {
    ngEcs.$s('system1', {
      $require: ['component1']
    });

    ngEcs.$s('system2', {
      $require: ['component2']
    });

    ngEcs.$s('system3', {
      $require: ['component3']
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1']
    });

    ngEcs.$e(['component1']);
    ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect(ngEcs.systems.system1.$family.length).toBe(2);
    expect(ngEcs.systems.system2.$family.length).toBe(3);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(1);
  });

  it('should call $addEntity', function () {

    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$e(['component1']);
    ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect($systems.system1.$addEntity.calls.length).toBe(2);
    expect($systems.system2.$addEntity.calls.length).toBe(3);
    expect($systems.system3.$addEntity.calls.length).toBe(0);
    expect($systems.system4.$addEntity.calls.length).toBe(1);
  });

  it('should be able to add components later', function () {

    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    var e1 = ngEcs.$e();
    var e2 = ngEcs.$e();
    var e3 = ngEcs.$e();
    var e4 = ngEcs.$e();

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.system1.$family.length).toBe(0);
    expect($systems.system2.$family.length).toBe(0);
    expect($systems.system3.$family.length).toBe(0);
    expect($systems.system4.$family.length).toBe(0);
    expect($systems.system1.$addEntity.calls.length).toBe(0);
    expect($systems.system2.$addEntity.calls.length).toBe(0);
    expect($systems.system3.$addEntity.calls.length).toBe(0);
    expect($systems.system4.$addEntity.calls.length).toBe(0);

    e1.$add('component1');
    e2.$add('component1');
    e2.$add('component2');
    e3.$add('component2');
    e4.$add('component2');

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect($systems.system1.$family.length).toBe(2);
    expect($systems.system2.$family.length).toBe(3);
    expect($systems.system3.$family.length).toBe(0);
    expect($systems.system4.$family.length).toBe(1);
    expect($systems.system1.$addEntity.calls.length).toBe(2);
    expect($systems.system2.$addEntity.calls.length).toBe(3);
    expect($systems.system3.$addEntity.calls.length).toBe(0);
    expect($systems.system4.$addEntity.calls.length).toBe(1);

  });

  it('should be able to remove components', function () {
    var c1 = 0, c2 = 0, c3 = 0, c4 = 0;
    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: jasmine.createSpy('$addEntity')
    });

    ngEcs.$e(['component1']);
    var e2 = ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.system1.$family.length).toBe(2);
    expect($systems.system2.$family.length).toBe(3);
    expect($systems.system3.$family.length).toBe(0);
    expect($systems.system4.$family.length).toBe(1);
    expect($systems.system1.$addEntity.calls.length).toBe(2);
    expect($systems.system2.$addEntity.calls.length).toBe(3);
    expect($systems.system3.$addEntity.calls.length).toBe(0);
    expect($systems.system4.$addEntity.calls.length).toBe(1);

    e2.$remove('component2');

    expect($systems.system1.$family.length).toBe(2);
    expect($systems.system2.$family.length).toBe(2);
    expect($systems.system3.$family.length).toBe(0);
    expect($systems.system4.$family.length).toBe(0);
    expect($systems.system1.$addEntity.calls.length).toBe(2);
    expect($systems.system2.$addEntity.calls.length).toBe(3);
    expect($systems.system3.$addEntity.calls.length).toBe(0);
    expect($systems.system4.$addEntity.calls.length).toBe(1);

  });

  it('should reuse families', function () {

    ngEcs.$s('system1', {
      $require: ['component1']
    });

    ngEcs.$s('system2', {
      $require: ['component2']
    });

    ngEcs.$s('system3', {
      $require: ['component1']
    });

    expect($systems.system1.$family).toBe($systems.system3.$family);
    expect($systems.system1.$family).toNotBe($systems.system2.$family);

  });

});
