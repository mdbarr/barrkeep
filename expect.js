'use strict';

const assert = require('node:assert').strict;
const { resolve, resolves } = require('./utils');

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

///////////

function Expectation (value) {
  this.value = value;
  this.negated = false;

  // Chaining
  this.a = this;
  this.an = this;
  this.and = this;
  this.be = this;
  this.been = this;
  this.has = this;
  this.have = this;
  this.is = this;
  this.of = this;
  this.the = this;
  this.to = this;
  this.with = this;

  //////////

  Object.defineProperty(this, 'not', {
    get () {
      this.negated = !this.negated;
      return this;
    },
  });

  Object.defineProperty(this, 'which', {
    get () {
      this.value = this.next !== undefined ? this.next : this.value;
      this.negated = false;
      return this;
    },
  });
}

//////////

Expectation.prototype.deepStrictEqual = function (actual, expected, message) {
  if (this.negated) {
    assert.notDeepStrictEqual(actual, expected, message);
  } else {
    assert.deepStrictEqual(actual, expected, message);
  }
};

Expectation.prototype.strictEqual = function (actual, expected, message) {
  if (this.negated) {
    assert.notStrictEqual(actual, expected, message);
  } else {
    assert.strictEqual(actual, expected, message);
  }
};

//////////

Expectation.prototype.equal = function (value) {
  this.deepStrictEqual(this.value, value);
  return this;
};
Expectation.prototype.equals = Expectation.prototype.equal;

Expectation.prototype.true = function () {
  this.strictEqual(this.value, true);
  return this;
};

Expectation.prototype.truthy = function () {
  this.strictEqual(Boolean(this.value), true);
  return this;
};

Expectation.prototype.ok = function () {
  this.strictEqual(Boolean(this.value), true);
  return this;
};

Expectation.prototype.false = function () {
  this.strictEqual(this.value, false);
  return this;
};

Expectation.prototype.falsey = function () {
  this.strictEqual(Boolean(this.value), false);
  return this;
};

Expectation.prototype.null = function () {
  this.strictEqual(this.value, null);
  return this;
};

Expectation.prototype.undefined = function () {
  this.strictEqual(this.value, undefined);
  return this;
};

Expectation.prototype.finite = function () {
  this.strictEqual(Number.isFinite(this.value), true);
  return this;
};

Expectation.prototype.infinite = function () {
  this.strictEqual(this.value === Infinity, true);
  return this;
};
Expectation.prototype.infinity = Expectation.prototype.infinite;
Expectation.prototype.Infinity = Expectation.prototype.infinite;

Expectation.prototype.nan = function () {
  this.strictEqual(Number.isNaN(this.value), true);
  return this;
};
Expectation.prototype.NaN = Expectation.prototype.nan;

Expectation.prototype.instanceof = function (constructor) {
  this.strictEqual(this.value instanceof constructor, true);
  return this;
};
Expectation.prototype.instanceOf = Expectation.prototype.instanceof;

Expectation.prototype.typeof = function (type) {
  this.strictEqual(typeof this.value === type, true);
  return this;
};
Expectation.prototype.typeOf = Expectation.prototype.typeof;
Expectation.prototype.type = Expectation.prototype.typeof;

Expectation.prototype.class = function () {
  this.strictEqual(this.value.toString().startsWith('class '), true);
  return this;
};

Expectation.prototype.Array = function () {
  this.strictEqual(Array.isArray(this.value), true);
  return this;
};

Expectation.prototype.Boolean = function () {
  this.strictEqual(this.value instanceof Boolean || typeof this.value === 'boolean', true);
  return this;
};

Expectation.prototype.Buffer = function () {
  this.strictEqual(Buffer.isBuffer(this.value), true);
  return this;
};

Expectation.prototype.Date = function () {
  this.strictEqual(this.value instanceof Date, true);
  return this;
};

Expectation.prototype.Error = function () {
  this.strictEqual(this.value instanceof Error, true);
  return this;
};

Expectation.prototype.Function = function () {
  this.strictEqual(this.value instanceof Function || typeof this.value === 'function', true);
  return this;
};

Expectation.prototype.AsyncFunction = function () {
  this.strictEqual(this.value instanceof AsyncFunction, true);
  return this;
};

Expectation.prototype.Map = function () {
  this.strictEqual(this.value instanceof Map, true);
  return this;
};

Expectation.prototype.Number = function () {
  this.strictEqual(this.value instanceof Number || typeof this.value === 'number', true);
  return this;
};

Expectation.prototype.Object = function () {
  this.strictEqual(this.value instanceof Object || typeof this.value === 'object', true);
  return this;
};

Expectation.prototype.Promise = function () {
  this.strictEqual(this.value instanceof Promise, true);
  return this;
};

Expectation.prototype.RegExp = function () {
  this.strictEqual(this.value instanceof RegExp, true);
  return this;
};

Expectation.prototype.Set = function () {
  this.strictEqual(this.value instanceof Set, true);
  return this;
};

Expectation.prototype.String = function () {
  this.strictEqual(this.value instanceof String || typeof this.value === 'string', true);
  return this;
};

Expectation.prototype.Symbol = function () {
  this.strictEqual(this.value instanceof Symbol, true);
  return this;
};

Expectation.prototype.WeakMap = function () {
  this.strictEqual(this.value instanceof WeakMap, true);
  return this;
};

Expectation.prototype.WeakSet = function () {
  this.strictEqual(this.value instanceof WeakSet, true);
  return this;
};

Expectation.prototype.has = function (value) {
  this.strictEqual(this.value instanceof Map || this.value instanceof Set ||
                     this.value instanceof WeakMap || this.value instanceof WeakSet, true);
  this.strictEqual(this.value.has(value), true);
  return this;
};

Expectation.prototype.includes = function (value) {
  this.strictEqual(typeof this.value === 'string' || Array.isArray(this.value), true);
  this.strictEqual(this.value.includes(value), true);
  return this;
};
Expectation.prototype.include = Expectation.prototype.includes;

Expectation.prototype.in = function (...args) {
  const array = args.length === 1 ? args[0] : args;
  this.strictEqual(array.includes(this.value), true);
  return this;
};

Expectation.prototype.within = function (lower, upper, inclusive = true) {
  if (inclusive) {
    this.strictEqual(this.value >= lower, true);
    this.strictEqual(this.value <= upper, true);
  } else {
    this.strictEqual(this.value > lower, true);
    this.strictEqual(this.value < upper, true);
  }
  return this;
};

Expectation.prototype.above = function (value, inclusive = true) {
  if (inclusive) {
    this.strictEqual(this.value >= value, true);
  } else {
    this.strictEqual(this.value > value, true);
  }
  return this;
};

Expectation.prototype.below = function (value, inclusive = true) {
  if (inclusive) {
    this.strictEqual(this.value <= value, true);
  } else {
    this.strictEqual(this.value < value, true);
  }
  return this;
};

Expectation.prototype.approximately = function (value, tolerance = 0.00005) {
  this.strictEqual(Math.abs(value - this.value) <= tolerance, true);
  return this;
};

Expectation.prototype.startWith = function (string) {
  this.strictEqual(typeof this.value === 'string', true);
  this.strictEqual(this.value.startsWith(string), true);
  return this;
};
Expectation.prototype.startsWith = Expectation.prototype.startWith;

Expectation.prototype.endWith = function (string) {
  this.strictEqual(typeof this.value === 'string', true);
  this.strictEqual(this.value.endsWith(string), true);
  return this;
};
Expectation.prototype.endsWith = Expectation.prototype.endWith;

//////////

Expectation.prototype.property = function (...args) {
  const property = args[0];

  this.strictEqual(resolves(this.value, property), true);
  if (args.length === 2) {
    const value = args[1];
    this.strictEqual(resolve(this.value, property), value);
  }

  this.next = resolve(this.value, property);
  return this;
};

//////////

module.exports = function (value) {
  return new Expectation(value);
};
