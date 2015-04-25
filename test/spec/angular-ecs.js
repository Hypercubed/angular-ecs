'use strict';

describe('module', function () {

  var ngEcs;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_){
    ngEcs = _ngEcs_;
  }));

  it('should setup engine', function () {
    expect(ngEcs).toBeDefined();
    expect(ngEcs.components).toBeDefined();
    expect(ngEcs.systems).toBeDefined();
    expect(ngEcs.entities).toBeDefined();
  });

});

describe('entities', function () {

  var ngEcs, $entities;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$entities_){
    ngEcs = _ngEcs_;
    $entities = _$entities_;
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
    var called = [];

    var e = ngEcs.$e();

    e.$on('test',function() {
      expect(this).toBe(e);
      called.push(Array.prototype.slice.apply(arguments));
    });

    e.$emit('test', 'arg1');
    e.$emit('test', 'arg2', 'arg3');

    expect(called).toEqual([['arg1'],['arg2','arg3']]);
  });

  it('should pass entity to constructor', function () {
    var called = 0;

    var e = ngEcs.$e();

    function TestComponent(_e) {
      expect(_e).toBe(e);
      called++;
    }

    ngEcs.$c('testComponent', TestComponent);

    e.$add('testComponent');

    expect(called).toBe(1);
    expect(e.testComponent instanceof TestComponent);
    expect(e.testComponent.prototype === TestComponent.prototype);
  });

  it('should be able to add events in constructor', function () {
    var called = 0;

    function TestComponent(_e) {
      _e.$on('test', function() {
        called++;
      });
    }

    ngEcs.$c('testComponent', TestComponent);

    var e = ngEcs.$e(['testComponent']);

    e.$emit('test');
    e.$emit('test');

    expect(called).toBe(2);
    expect(e.testComponent instanceof TestComponent);
    expect(e.testComponent.prototype === TestComponent.prototype);
  });

});

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

  it('should use object as base', function () {
    ngEcs.$c('testComponent', { testing: 123 });
    var e = ngEcs.$e(['testComponent']);
    expect(e.testComponent.testing).toBe(123);
  });

  it('should use function as constructor', function () {
    var called = 0;

    function TestComponent() {
      called++;
    }

    ngEcs.$c('testComponent', TestComponent);
    var e = ngEcs.$e(['testComponent']);

    expect(called).toBe(1);
    expect(e.testComponent instanceof TestComponent);
    expect(e.testComponent.prototype === TestComponent.prototype);
  });

  it('should use function as constructor, unless already an instance', function () {
    var called = 0;

    function TestComponent() {
      called++;
    }

    ngEcs.$c('testComponent', TestComponent);
    var e = ngEcs.$e({});
    e.$add('testComponent', new TestComponent());

    expect(called).toBe(1);
    expect(e.testComponent instanceof TestComponent);
    expect(e.testComponent.prototype === TestComponent.prototype);
  });

});

describe('systems', function () {

  var ngEcs, $systems;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$systems_){
    ngEcs = _ngEcs_;
    $systems = _$systems_;
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

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect(ngEcs.systems.system1.$family.length).toBe(2);
    expect(ngEcs.systems.system2.$family.length).toBe(3);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(1);
  });

  it('should call $addEntity', function () {
    var c1 = 0, c2 = 0, c3 = 0, c4 = 0;
    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: function() {
        c1++;
      }
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: function() {
        c2++;
      }
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: function() {
        c3++;
      }
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: function() {
        c4++;
      }
    });

    ngEcs.$e(['component1']);
    ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect(c1).toBe(2);
    expect(c2).toBe(3);
    expect(c3).toBe(0);
    expect(c4).toBe(1);
  });

  it('should be able to add components later', function () {
    var c1 = 0, c2 = 0, c3 = 0, c4 = 0;
    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: function() {
        c1++;
      }
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: function() {
        c2++;
      }
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: function() {
        c3++;
      }
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: function() {
        c4++;
      }
    });

    var e1 = ngEcs.$e();
    var e2 = ngEcs.$e();
    var e3 = ngEcs.$e();
    var e4 = ngEcs.$e();

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect(ngEcs.systems.system1.$family.length).toBe(0);
    expect(ngEcs.systems.system2.$family.length).toBe(0);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(0);
    expect(c1).toBe(0);
    expect(c2).toBe(0);
    expect(c3).toBe(0);
    expect(c4).toBe(0);

    e1.$add('component1');
    e2.$add('component1');
    e2.$add('component2');
    e3.$add('component2');
    e4.$add('component2');


    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect(ngEcs.systems.system1.$family.length).toBe(2);
    expect(ngEcs.systems.system2.$family.length).toBe(3);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(1);
    expect(c1).toBe(2);
    expect(c2).toBe(3);
    expect(c3).toBe(0);
    expect(c4).toBe(1);

  });

  it('should be able to remove components', function () {
    var c1 = 0, c2 = 0, c3 = 0, c4 = 0;
    ngEcs.$s('system1', {
      $require: ['component1'],
      $addEntity: function() {
        c1++;
      }
    });

    ngEcs.$s('system2', {
      $require: ['component2'],
      $addEntity: function() {
        c2++;
      }
    });

    ngEcs.$s('system3', {
      $require: ['component3'],
      $addEntity: function() {
        c3++;
      }
    });

    ngEcs.$s('system4', {
      $require: ['component2','component1'],
      $addEntity: function() {
        c4++;
      }
    });

    ngEcs.$e(['component1']);
    var e2 = ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect(ngEcs.systems.system1.$family.length).toBe(2);
    expect(ngEcs.systems.system2.$family.length).toBe(3);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(1);
    expect(c1).toBe(2);
    expect(c2).toBe(3);
    expect(c3).toBe(0);
    expect(c4).toBe(1);

    e2.$remove('component2');

    expect(ngEcs.systems.system1.$family.length).toBe(2);
    expect(ngEcs.systems.system2.$family.length).toBe(2);
    expect(ngEcs.systems.system3.$family.length).toBe(0);
    expect(ngEcs.systems.system4.$family.length).toBe(0);
    expect(c1).toBe(2);
    expect(c2).toBe(3);
    expect(c3).toBe(0);
    expect(c4).toBe(1);

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

    expect(ngEcs.systems.system1.$family).toBe(ngEcs.systems.system3.$family);
    expect(ngEcs.systems.system1.$family).toNotBe(ngEcs.systems.system2.$family);

  });

  it('should call update', function () {
    var c = 0;

    ngEcs.$s('test', {
      $update: function(dt) {
        c++;
      }
    });

    ngEcs.$e({ 'test' :{} }); // needs and entity, with a component (fix this)
    ngEcs.$update();
    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update).toBeDefined();
    expect(c).toBe(3);
  });

  it('should call update and updateEach', function () {
    var c = 0, c2 = 0;

    ngEcs.$s('test', {
      $update: function(dt) {
        c++;
      },
      $updateEach: function(dt) {
        c2++;
      }
    });

    ngEcs.$e({ 'test' :{} }); // needs and entity, with a component (fix this)
    ngEcs.$e({ 'test' :{} }); // needs and entity, with a component (fix this)

    ngEcs.$update();
    ngEcs.$update();
    ngEcs.$update();

    expect($systems.test.$update).toBeDefined();
    expect(c).toBe(3);
    expect(c2).toBe(6);
  });

});
