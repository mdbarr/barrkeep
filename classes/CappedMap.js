'use strict';

function CappedMap(capacity = 100) {
  const seen = new Array(capacity);
  const map = new Map();

  let start = 0;
  let size = 0;

  Object.defineProperty(this, 'size', {
    get() { return map.size; },
    set() {}
  });

  this.clear = () => {
    size = 0;
    start = 0;
    seen.splice(0, seen.length).concat(new Array(capacity));
    return map.clear();
  };

  this.delete = (key) => {
    return map.delete(key);
  };

  this.entries = map.entries;

  this.forEach = map.forEach;

  this.get = map.get;

  this.has = map.has;

  this.keys = map.keys;

  this.add = (key, value) => {
    if (start > 0) {
      start--;
    } else {
      start = capacity - 1;
    }

    if (seen[start]) {
      map.delete(seen[start]);
    }

    seen[start] = key;
    map.set(key, value);

    if (size < capacity) {
      size++;
    }

    return this;
  };

  this.values = map.values;

  this[Symbol.iterator] = map[Symbol.iterator];
}

module.exports = CappedMap;
