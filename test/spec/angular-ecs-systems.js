'use strict';

describe('systems', function () {

  var ngEcs, $systems, $entities, $families;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$systems_, _$entities_, _$families_){
    ngEcs = _ngEcs_;
    $systems = _$systems_;
    $entities = _$entities_;
    $families = _$families_;

    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: jasmine.createSpy('$addEntity'),
      $removeEntity: jasmine.createSpy('$removeEntity')
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: jasmine.createSpy('$addEntity'),
      $removeEntity: jasmine.createSpy('$removeEntity')
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: jasmine.createSpy('$addEntity'),
      $removeEntity: jasmine.createSpy('$removeEntity')
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: jasmine.createSpy('$addEntity'),
      $removeEntity: jasmine.createSpy('$removeEntity')
    });

    ngEcs.$s('system5', {
      $require: ['component1'],
      $addEntity: jasmine.createSpy('$addEntity'),
      $removeEntity: jasmine.createSpy('$removeEntity')
    });

  }));

  it('should create systems', function () {
    expect($systems.system1).toBeDefined();
    expect($systems).toBe(ngEcs.systems);
  });

  it('should reference family', function () {
    ngEcs.$s('test', {});
    expect($systems.test.$family).toBe($families['::']);
  });

  it('should auto generate system names', function () {
    var s = ngEcs.$s({
      test: 123
    });
    expect(s.$family).toBe($families['::']);
    expect(s.test).toBe(123);
  });

  it('should reference family', function () {
    expect($systems.system1.$family).toBe($families.component1);
  });

  it('should create systems and assign entities to families', function () {

    ngEcs.$e(['component1']);
    ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.system1.$family.length).toBe(2);
    expect($systems.system2.$family.length).toBe(3);
    expect($systems.system3.$family.length).toBe(0);
    expect($systems.system4.$family.length).toBe(1);
  });

  it('should call $addEntity', function () {

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

  it('should call $addEntity with entity', function () {

    var e = ngEcs.$e(['component1','component2']);

    expect($systems.system1.$addEntity).toHaveBeenCalledWith(e);

  });

  it('should call $addEntity with complete entity', function () {

    ngEcs.$s('system6', {
      $require: ['component1'],
      $addEntity: function(e) {
        expect(e.component1).toBeDefined();
        expect(e.component2).toBeDefined();
      }
    });

    var e = ngEcs.$e({
      component1: { x: 1, y: 2 },
      component2: { z: 3 }
    });

    expect($systems.system1.$addEntity).toHaveBeenCalledWith(e);

  });

  it('should be able to add components later', function () {

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

    expect(Object.keys($entities).length).toBe(4);
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
    expect($systems.system1.$removeEntity.calls.length).toBe(0);
    expect($systems.system2.$removeEntity.calls.length).toBe(1);
    expect($systems.system3.$removeEntity.calls.length).toBe(0);
    expect($systems.system4.$removeEntity.calls.length).toBe(1);
  });

  it('should be able to remove components within system updateEach', function () {

    ngEcs.$s('systemX', {
      $require: ['component2','component1'],
      $updateEach: function(e,dt) {

        if (e._id === '2') {
          e.$remove('component2');
        }

      }
    });

    spyOn($systems.systemX, '$updateEach').andCallThrough();

    ngEcs.$e('1', ['component1','component2']);
    ngEcs.$e('2', ['component1','component2']);
    ngEcs.$e('3', ['component1','component2']);
    ngEcs.$e('4', ['component1','component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.systemX.$family.length).toBe(4);

    ngEcs.$update(1);

    expect($systems.systemX.$updateEach.calls.length).toBe(4);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.systemX.$family.length).toBe(3);
  });

  it('should be able to add components within system updateEach', function () {

    ngEcs.$s('systemX', {
      $require: ['component1'],
      $updateEach: function(e,dt) {

        if (e._id === '2') {
          e.$add('component2');
        }

      }
    });

    spyOn($systems.systemX, '$updateEach').andCallThrough();

    ngEcs.$e('1', ['component1','component2']);
    ngEcs.$e('2', ['component1']);
    ngEcs.$e('3', ['component1']);
    ngEcs.$e('4', ['component1','component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.systemX.$family.length).toBe(4);
    expect($systems.system4.$family.length).toBe(2);

    ngEcs.$update(1);

    expect($systems.systemX.$updateEach.calls.length).toBe(4);

    expect(Object.keys($entities).length).toBe(4);
    expect($systems.systemX.$family.length).toBe(4);
    expect($systems.system4.$family.length).toBe(3);

  });

  it('should call removeEntity once', function () {

    var e = ngEcs.$e(['component1','component2']);

    e.$remove('component2');
    e.$remove('component1');

    expect($systems.system4.$removeEntity.calls.length).toBe(1);
  });

  it('should reuse families', function () {

    expect($systems.system1.$family).toBe($systems.system5.$family);
    expect($systems.system1.$family).toNotBe($systems.system2.$family);

  });

  it('should set default priority', function() {

    var i = 0;

    ngEcs.$s('system0', {
      $update: function(e,dt) {
        expect(i++).toBe(0);
      }
    });

    ngEcs.$s('system10', {
      $update: function(e,dt) {
        expect(i++).toBe(1);
      }
    });

    ngEcs.$e();

    ngEcs.$update();

  });

  it('should set $priority', function() {

    var i = 0;

    ngEcs.$s('system0', {
      $priority: 10,
      $update: function(e,dt) {
        expect(i++).toBe(1);
      }
    });

    ngEcs.$s('system10', {
      $priority: 100,
      $update: function(e,dt) {
        expect(i++).toBe(0);
      }
    });

    ngEcs.$e();

    ngEcs.$update();

  });

});
