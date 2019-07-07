'use strict';

const assert = require('assert').strict;
const {
  resolve, resolves
} = require('./utils');

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

///////////

function Expectation(value) {
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

  Object.defineProperty(this, 'which', { get() {
    this.value = this.next !== undefined ? this.next : this.value;
    this.negated = false;
    return this;
  } });
}

//////////

Expectation.prototype.equal = function(value) {
  assert.deepStrictEqual(this.value, value);
  return this;
};
Expectation.prototype.equals = Expectation.prototype.equal;

Expectation.prototype.true = function() {
  assert.strictEqual(this.value, true);
  return this;
};

Expectation.prototype.truthy = function() {
  assert.strictEqual(Boolean(this.value), true);
  return this;
};

Expectation.prototype.ok = function() {
  assert.strictEqual(Boolean(this.value), true);
  return this;
};

Expectation.prototype.false = function() {
  assert.strictEqual(this.value, false);
  return this;
};

Expectation.prototype.falsey = function() {
  assert.strictEqual(Boolean(this.value), false);
  return this;
};

Expectation.prototype.null = function() {
  assert.strictEqual(this.value, null);
  return this;
};

Expectation.prototype.undefined = function() {
  assert.strictEqual(this.value, undefined);
  return this;
};

Expectation.prototype.finite = function() {
  assert.strictEqual(Number.isFinite(this.value), true);
  return this;
};

Expectation.prototype.infinite = function() {
  assert.strictEqual(this.value === Infinity, true);
  return this;
};
Expectation.prototype.infinity = Expectation.prototype.infinite;
Expectation.prototype.Infinity = Expectation.prototype.infinite;

Expectation.prototype.nan = function() {
  assert.strictEqual(Number.isNaN(this.value), true);
  return this;
};
Expectation.prototype.NaN = Expectation.prototype.nan;

Expectation.prototype.instanceof = function(constructor) {
  assert.strictEqual(this.value instanceof constructor, true);
  return this;
};
Expectation.prototype.instanceOf = Expectation.prototype.instanceof;

Expectation.prototype.typeof = function(type) {
  assert.strictEqual(typeof this.value === type, true);
  return this;
};
Expectation.prototype.typeOf = Expectation.prototype.typeof;
Expectation.prototype.type = Expectation.prototype.typeof;

Expectation.prototype.class = function() {
  assert.strictEqual(this.value.toString().startsWith('class '), true);
  return this;
};

Expectation.prototype.Array = function() {
  assert.strictEqual(Array.isArray(this.value), true);
  return this;
};

Expectation.prototype.Boolean = function() {
  assert.strictEqual(this.value instanceof Boolean || typeof this.value === 'boolean', true);
  return this;
};

Expectation.prototype.Buffer = function() {
  assert.strictEqual(Buffer.isBuffer(this.value), true);
  return this;
};

Expectation.prototype.Date = function() {
  assert.strictEqual(this.value instanceof Date, true);
  return this;
};

Expectation.prototype.Error = function() {
  assert.strictEqual(this.value instanceof Error, true);
  return this;
};

Expectation.prototype.Function = function() {
  assert.strictEqual(this.value instanceof Function || typeof this.value === 'function', true);
  return this;
};

Expectation.prototype.AsyncFunction = function() {
  assert.strictEqual(this.value instanceof AsyncFunction, true);
  return this;
};

Expectation.prototype.Map = function() {
  assert.strictEqual(this.value instanceof Map, true);
  return this;
};

Expectation.prototype.Number = function() {
  assert.strictEqual(this.value instanceof Number || typeof this.value === 'number', true);
  return this;
};

Expectation.prototype.Object = function() {
  assert.strictEqual(this.value instanceof Object || typeof this.value === 'object', true);
  return this;
};

Expectation.prototype.Promise = function() {
  assert.strictEqual(this.value instanceof Promise, true);
  return this;
};

Expectation.prototype.RegExp = function() {
  assert.strictEqual(this.value instanceof RegExp, true);
  return this;
};

Expectation.prototype.Set = function() {
  assert.strictEqual(this.value instanceof Set, true);
  return this;
};

Expectation.prototype.String = function() {
  assert.strictEqual(this.value instanceof String || typeof this.value === 'string', true);
  return this;
};

Expectation.prototype.Symbol = function() {
  assert.strictEqual(this.value instanceof Symbol, true);
  return this;
};

Expectation.prototype.WeakMap = function() {
  assert.strictEqual(this.value instanceof WeakMap, true);
  return this;
};

Expectation.prototype.WeakSet = function() {
  assert.strictEqual(this.value instanceof WeakSet, true);
  return this;
};

Expectation.prototype.has = function(value) {
  assert.strictEqual(this.value instanceof Map || this.value instanceof Set ||
                     this.value instanceof WeakMap || this.value instanceof WeakSet, true);
  assert.strictEqual(this.value.has(value), true);
  return this;
};

Expectation.prototype.includes = function(value) {
  assert.strictEqual(typeof this.value === 'string' || Array.isArray(this.value), true);
  assert.strictEqual(this.value.includes(value), true);
  return this;
};
Expectation.prototype.include = Expectation.prototype.includes;

Expectation.prototype.in = function(...args) {
  const array = args.length === 1 ? args[0] : args;
  assert.strictEqual(array.includes(this.value), true);
  return this;
};

Expectation.prototype.within = function(lower, upper, inclusive = true) {
  if (inclusive) {
    assert.strictEqual(this.value >= lower, true);
    assert.strictEqual(this.value <= upper, true);
  } else {
    assert.strictEqual(this.value > lower, true);
    assert.strictEqual(this.value < upper, true);
  }
  return this;
};

Expectation.prototype.approximately = function(value, tolerance = 0.00005) {
  assert.strictEqual(Math.abs(value - this.value) <= tolerance, true);
  return this;
};

Expectation.prototype.startWith = function(string) {
  assert.strictEqual(typeof this.value === 'string', true);
  assert.strictEqual(this.value.startsWith(string), true);
  return this;
};
Expectation.prototype.startsWith = Expectation.prototype.startWith;

Expectation.prototype.endWith = function(string) {
  assert.strictEqual(typeof this.value === 'string', true);
  assert.strictEqual(this.value.endsWith(string), true);
  return this;
};
Expectation.prototype.endsWith = Expectation.prototype.endWith;

//////////

Expectation.prototype.property = function(...args) {
  const property = args[0];

  assert.strictEqual(resolves(this.value, property), true);
  if (args.length === 2) {
    const value = args[1];
    assert.strictEqual(resolve(this.value, property), value);
  }

  this.next = resolve(this.value, property);
  return this;
};

//////////

module.exports = function(value) {
  return new Expectation(value);
};
