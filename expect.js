'use strict';

const assert = require('assert').strict;
const {
  resolve, resolves
} = require('./utils');

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

Expectation.prototype.equal = function(input) {
  assert.deepStrictEqual(this.value, input);
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

Expectation.prototype.includes = function(value) {
  assert.strictEqual(typeof this.value === 'string' || Array.isArray(this.value), true);
  assert.strictEqual(this.value.includes(value), true);
  return this;
};
Expectation.prototype.include = Expectation.prototype.includes;

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
