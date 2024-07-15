'use strict';

function Dictionary (initial) {
  const keys = new Map();
  const values = new Map();

  Object.defineProperty(this, 'size', { get () { return keys.size; } });

  this.clear = () => {
    keys.clear();
    values.clear();
    return this;
  };

  this.delete = (key) => {
    if (keys.has(key)) {
      const value = keys.get(key);
      keys.delete(key);
      values.delete(value);
      return true;
    } else if (values.has(key)) {
      const value = key;
      const id = values.get(value);
      keys.delete(id);
      values.delete(value);
      return true;
    }
    return false;
  };

  this.entries = keys.entries;

  this.get = (key) => {
    if (keys.has(key)) {
      return keys.get(key);
    } else if (values.has(key)) {
      return values.get(key);
    }
    // eslint-disable-next-line no-undefined
    return undefined;
  };

  this.has = (key) => keys.has(key) || values.has(key);

  this.keys = keys.keys;

  this.set = (key, value) => {
    keys.set(key, value);
    values.set(value, key);

    return this;
  };

  this.values = values.values;

  this[Symbol.iterator] = keys[Symbol.iterator];

  if (initial) {
    for (const key in initial) {
      if (Object.hasOwn(initial, key)) {
        this.set(key, initial[key]);
      }
    }
  }
}

module.exports = Dictionary;
