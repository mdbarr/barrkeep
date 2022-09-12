'use strict';

require('../pp');
const utils = require('../utils');

const a = {
  a: 10,
  b: 'fooo',
  c: [ 1, 2, 3 ],
  d: { e: 20 },
  f: [ 5, 10, 15 ],
};

const b = {
  c: {
    c: 10,
    d: { e: [ { f: { g: { h: { i: 'rule' } } } } ] },
  },
};

describe('Utilities Test', () => {
  it('should test $resolve(s)', () => {
    expect(utils.resolve(a, 'c[1]')).toEqual(2);
    expect(utils.resolves(a, 'c[0]')).toBe(true);
    expect(utils.resolve(b, 'c.d.e[0].f.g.h.i')).toEqual('rule');
  });

  it('should test $set', () => {
    expect(utils.set(b, 'c.d.e[0].f.g.h.i', 'rules')).toBe(true);
    expect(utils.resolve(b, 'c.d.e[0].f.g.h.i')).toEqual('rules');
  });

  it('should test formatting numbers as bytes', () => {
    expect(utils.formatBytes(1000)).toBe('1000 Bytes');
    expect(utils.formatBytes(1024)).toBe('1 KB');
  });

  it('should test camelcasing a string', () => {
    expect(utils.camelize('This is a test of Some-Stuff')).toBe('thisIsATestOfSomeStuff');
  });

  it('should test formatting a number as a string', () => {
    expect(utils.formatNumber(1)).toBe('one');
    expect(utils.formatNumber(11)).toBe('11');
  });

  it('should test once function wrapper', () => {
    let value = 0;
    const func = utils.once(() => { value++; });

    func();
    func();
    func();

    expect(value).toBe(1);
  });

  it('should test precision rounding', () => {
    expect(utils.precisionRound(1.34567347)).toBe(1.35);
    expect(utils.precisionRound(0.9999999999999)).toBe(1);
  });

  it('should test inclusive $project', () => {
    expect(utils.project(a, {
      a: 1,
      c: 1,
      f: 1,
    })).toEqual({
      a: 10,
      c: [ 1, 2, 3 ],
      f: [ 5, 10, 15 ],
    });
  });

  it('should test exclusive $project', () => {
    expect(utils.project(a, {
      a: 0,
      c: 0,
      f: 0,
    })).toEqual({
      b: 'fooo',
      d: { e: 20 },
    });
  });

  it('it should test deep property with name change $project', () => {
    expect(utils.project(a, { 'd.e': 'foo' })).toEqual({ foo: 20 });
  });

  it('should test $filter', () => {
    expect(utils.filter(a, /[abc]/, false)).toEqual({
      d: { e: 20 },
      f: [ 5, 10, 15 ],
    });
  });

  it('should test $remove', () => {
    utils.remove(a, 'd.e', true);
    expect(a).toEqual({
      a: 10,
      b: 'fooo',
      c: [ 1, 2, 3 ],
      f: [ 5, 10, 15 ],
    });
  });

  it('should test duration', () => {
    expect(utils.duration(3534245)).toBe('58 minutes');
    expect(utils.duration(23468, { units: 'h m s' })).toBe('23 seconds');
    expect(utils.duration(9845)).toBe('less than a minute');
    expect(utils.duration(4565467)).toBe('1 hour, 16 minutes');
  });

  it('should test flatten', () => {
    const flatten = utils.flatten({
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4,
        f: { g: 5 },
      },
    });
    expect(flatten).toStrictEqual({
      'a': 1,
      'b': 2,
      'c$type': 'Object',
      'c.d': 3,
      'c.e': 4,
      'c.f$type': 'Object',
      'c.f.g': 5,
    });
  });
});
