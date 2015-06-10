'use strict';

describe('families', function () {

  var ngEcs, $systems, $entities, $families;

  beforeEach(module('hc.ngEcs', function() {

  }));

  beforeEach(inject(function(_ngEcs_, _$systems_, _$entities_, _$families_){
    ngEcs = _ngEcs_;
    $systems = _$systems_;
    $entities = _$entities_;
    $families = _$families_;

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

    ngEcs.$s('system5', {
      $require: ['component1']
    });

  }));

  it('should create family', function () {
    ngEcs.$s('test', {});
    expect($families['::']).toBeDefined();
    expect($families['::']　instanceof Array);
    expect($families['::'].length).toBe(0);
  });

  it('should assign entities to families', function () {

    ngEcs.$e(['component1']);
    ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($families.component1.length).toBe(2);
    expect($families.component2.length).toBe(3);
    expect($families.component3.length).toBe(0);
    expect($families['component1::component2'].length).toBe(1);
  });

  it('should be able to add components later', function () {

    var e1 = ngEcs.$e();
    var e2 = ngEcs.$e();
    var e3 = ngEcs.$e();
    var e4 = ngEcs.$e();

    expect(Object.keys($entities).length).toBe(4);
    expect($families.component1.length).toBe(0);
    expect($families.component2.length).toBe(0);
    expect($families.component3.length).toBe(0);
    expect($families['component1::component2'].length).toBe(0);

    e1.$add('component1');
    e2.$add('component1');
    e2.$add('component2');
    e3.$add('component2');
    e4.$add('component2');

    expect(Object.keys(ngEcs.entities).length).toBe(4);
    expect($families.component1.length).toBe(2);
    expect($families.component2.length).toBe(3);
    expect($families.component3.length).toBe(0);
    expect($families['component1::component2'].length).toBe(1);

  });

  it('should be able to remove components', function () {

    ngEcs.$e(['component1']);
    var e2 = ngEcs.$e(['component1','component2']);
    ngEcs.$e(['component2']);
    ngEcs.$e(['component2']);

    expect(Object.keys($entities).length).toBe(4);
    expect($families.component1.length).toBe(2);
    expect($families.component2.length).toBe(3);
    expect($families.component3.length).toBe(0);
    expect($families['component1::component2'].length).toBe(1);

    e2.$remove('component2');

    expect($families.component1.length).toBe(2);
    expect($families.component2.length).toBe(2);
    expect($families.component3.length).toBe(0);
    expect($families['component1::component2'].length).toBe(0);

  });

  it('should reuse families', function () {

    expect($systems.system1.$family).toBe($families.component1);
    expect($systems.system2.$family).toBe($families.component2);
    expect($systems.system1.$family).toBe($systems.system5.$family);

  });
  
  it('should create a families', function () {
    
    var f = ngEcs.$f(['component4']);

    ngEcs.$e(['component4']);
    ngEcs.$e(['component4','component5']);
    ngEcs.$e(['component5']);
    ngEcs.$e(['component5']);

    expect(Object.keys($entities).length).toBe(4);
    expect(f.length).toBe(2);
  });
  
  it('should allow creating a families after entities', function () {

    ngEcs.$e(['component4']);
    ngEcs.$e(['component4','component5']);
    ngEcs.$e(['component5']);
    ngEcs.$e(['component5']);
    
    var f = ngEcs.$f(['component4']);

    expect(Object.keys($entities).length).toBe(4);
    expect(f.length).toBe(2);
  });

});
