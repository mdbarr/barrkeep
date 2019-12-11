'use strict';

require('../pp');
const crypto = require('crypto');
const utils = require('../utils');

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

describe('Utilities Test', () => {
  it('should test $resolve(s)', () => {
    expect(utils.resolve(a, 'c[1]')).toEqual(2);
    expect(utils.resolves(a, 'c[0]')).toBe(true);
    expect(utils.resolve(b, 'c.d.e[0].f.g.h.i')).toEqual('rule');
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

  it('should test sha1 hashing', () => {
    expect(utils.sha1('foo')).toBe('0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33');
  });

  it('should test sha256 hashing', () => {
    expect(utils.sha256('foo')).
      toBe('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae');
  });

  it('should test encrypt and decrypt', () => {
    const key = crypto.randomBytes(16).toString('hex');
    const encrypted = utils.encrypt('super-secret', key);
    expect(utils.decrypt(encrypted, key)).toBe('super-secret');
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

  });

  it('should test inclusive $project', () => {
    expect(utils.project(a, {
      a: 1,
      c: 1,
      f: 1
    })).toEqual({
      a: 10,
      c: [ 1, 2, 3 ],
      f: [ 5, 10, 15 ]
    });
  });

  it('should test exclusive $project', () => {
    expect(utils.project(a, {
      a: 0,
      c: 0,
      f: 0
    })).toEqual({
      b: 'fooo',
      d: { e: 20 }
    });
  });

  it('it should test deep property with name change $project', () => {
    expect(utils.project(a, { 'd.e': 'foo' })).toEqual({ foo: 20 });
  });

  it('should test $filter', () => {
    expect(utils.filter(a, /[abc]/, false)).toEqual({
      d: { e: 20 },
      f: [ 5, 10, 15 ]
    });
  });

  it('should test $remove', () => {
    utils.remove(a, 'd.e', true);
    expect(a).toEqual({
      a: 10,
      b: 'fooo',
      c: [ 1, 2, 3 ],
      f: [ 5, 10, 15 ]
    });
  });
});
