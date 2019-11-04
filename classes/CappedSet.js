'use strict';

function CappedSet(capacity = 100) {
  const seen = new Array(capacity);
  const set = new Set();

  let start = 0;
  let size = 0;

  Object.defineProperty(this, 'size', {
    get() { return set.size; },
    set() {}
  });

  this.add = (id) => {
    if (start > 0) {
      start--;
    } else {
      start = capacity - 1;
    }

    if (seen[start]) {
      set.delete(seen[start]);
    }

    seen[start] = id;
    set.add(id);

    if (size < capacity) {
      size++;
    }
  };

  this.clear = () => {
    size = 0;
    start = 0;
    seen.splice(0, seen.length).concat(new Array(capacity));
    return set.clear();
  };

  this.delete = (id) => {
    return set.delete(id);
  };

  this.entries = set.entries;

  this.forEach = set.forEach;

  this.has = (id) => {
    return set.has(id);
  };

  this.values = set.values;

  this[Symbol.iterator] = set[Symbol.iterator];
}

module.exports = CappedSet;
