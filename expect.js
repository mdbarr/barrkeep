'use strict';

const assert = require('assert').strict;

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
    this.value = this.which;
    this.negated = false;
    return this;
  } });
}

//////////

Expectation.prototype.equal = function(input) {
  assert.deepStrictEqual(this.value, input);
  return this;
};

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

Expectation.prototype.instanceof = function(type) {
  assert.strictEqual(this.value instanceof type, true);
  return this;
};

Expectation.prototype.instanceOf = Expectation.prototype.instanceof;

//////////

Expectation.prototype.property = function(property) {
  assert.strictEqual(Object.resolves(this.value, property), true);
  this.which = Object.resolve(this.value, property);
  return this;
};

//////////

module.exports = function(value) {
  return new Expectation(value);
};
