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

  var ngEcs;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_){
    ngEcs = _ngEcs_;
  }));

  it('should start empty', function () {
    expect(Object.keys(ngEcs.entities).length).toBe(0);
  });

  it('should create entities', function () {
    var e = ngEcs.$e({});
    expect(Object.keys(ngEcs.entities).length).toBe(1);
    expect(ngEcs.entities[e._id]).toBe(e);
  });

  it('should create entities with id', function () {
    var e = ngEcs.$e('e1', {});
    expect(Object.keys(ngEcs.entities).length).toBe(1);
    expect(ngEcs.entities.e1).toBe(e);
  });

  it('should delete entities', function () {
    var e = ngEcs.$e({});
    ngEcs.$$removeEntity(e);
    expect(Object.keys(ngEcs.entities).length).toBe(0);
    expect(ngEcs.entities[e._id]).toBeUndefined();
  });

  it('should invoke callbacks', function () {
    var e = ngEcs.$e({});

    e.$on('add', function(_e,k) {
      expect(_e).toBe(e);
      expect(k).toBe('test');
    });

    e.$add('test');
  });

  it('should not invoke callbacks for non-components', function () {
    var e = ngEcs.$e({});

    e.$on('add', function(_e,k) {
      expect(_e).toBe(e);
      expect(k).toBe('test');
    });

    e.$add('test');
    e.$add('_test');
    e.$add('$test');
  });

});

describe('components', function () {

  var ngEcs;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_){
    ngEcs = _ngEcs_;
  }));

  it('should create components', function () {
    ngEcs.$c('test', {});
    expect(ngEcs.components.test).toBeDefined();
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

});

describe('systems', function () {

  var ngEcs;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_){
    ngEcs = _ngEcs_;
  }));

  it('should create systems', function () {
    ngEcs.$s('test', {});
    expect(ngEcs.systems.test).toBeDefined();
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
});
