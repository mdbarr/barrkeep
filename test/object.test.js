'use strict';

require('../pp');
require('../shim');

const a = {
  a: 10,
  b: 'fooo',
  c: [ 1, 2, 3 ],
  d: { e: 20 },
  f: [ 5, 10, 15 ]
};

const b = { c: {
  c: 10,
  d: { e: [ { f: { g: { h: { i: 'rule' } } } } ] }
} };

describe('Object Manipulation Test', () => {
  it('should test inclusive $project', () => {
    expect(Object.$project(a, {
      a: 1,
      c: 1,
      f: 1
    })).toEqual({
      a: 10,
      c: [ 1, 2, 3 ],
      f: [5, 10, 15]
    });
  })

  it('should test exclusive $project', () => {
    expect(Object.$project(a, {
      a: 0,
      c: 0,
      f: 0
    })).toEqual({
      b: 'fooo',
      d: { e: 20 }
    });
  });

  it('it should test deep property with name change $project', () => {
    expect(Object.$project(a, { 'd.e': 'foo' })).toEqual({ foo: 20 });
  });

  it('should test $filter', () => {
    expect(Object.$filter(a, /[abc]/, false)).toEqual({
      d: { e: 20 },
      f: [ 5, 10, 15 ]
    });
  });

  it('should test $remove', () => {
    Object.$remove(a, 'd.e', true);
    expect(a).toEqual({
        a: 10,
      b: 'fooo',
      c: [ 1, 2, 3 ],
      f: [ 5, 10, 15 ]
    });
  });

  it('should test $resolve(s)', () => {
    expect(Object.$resolve(a, 'c[1]')).toEqual(2);
    expect(Object.$resolves(a, 'c[0]')).toBe(true);
    expect(Object.$resolve(b, 'c.d.e[0].f.g.h.i')).toEqual('rule');
  });
});
