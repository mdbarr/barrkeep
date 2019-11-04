'use strict';

function CappedSet(capacity = 100) {
  const seen = new Array(capacity);
  const set = new Set();

  let start = 0;
  let size = 0;

  this.size = () => { return size; };

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

  this.has = (id) => {
    return set.has(id);
  };
}

module.exports = CappedSet;
