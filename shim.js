'use strict';

const fs = require('fs');
const vm = require('vm');

const query = require('./query');
const style = require('./style');
const emojify = require('./emojify');
const colorize = require('./colorize');

const {
  camelize,
  deepClone,
  expand,
  filter,
  flatten,
  formatBytes,
  formatNumber,
  merge,
  precisionRound,
  project,
  remove,
  resolve,
  resolves,
  set,
  setTypes,
  size
} = require('./utils');

Math.$round = precisionRound;

Number.$asBytes = formatBytes;
Number.$format = formatNumber;

Object.$expand = expand;
Object.$filter = filter;
Object.$flatten = flatten;
Object.$project = project;
Object.$query = query;
Object.$remove = remove;
Object.$resolve = resolve;
Object.$resolves = resolves;
Object.$set = set;
Object.$setTypes = setTypes;
Object.$size = size;

Object.defineProperty(Array.prototype, '$random', {
  value() {
    return Math.floor(Math.random() * this.length);
  },
  enumerable: false,
  configurable: true
});

Object.defineProperty(Array.prototype, '$shuffle', {
  value() {
    let j;
    let x;
    let i;

    for (i = this.length; i; i--) {
      j = Math.floor(Math.random() * i);
      x = this[i - 1];
      this[i - 1] = this[j];
      this[j] = x;
    }
    return this;
  },
  enumerable: false,
  configurable: true
});

Object.defineProperty(Array.prototype, '$pick', {
  value(count, asArray) {
    const arr = this.slice();
    const picks = [];

    if (count === 1 && arr.length === 1) {
      return arr[0];
    } else if (count >= arr.length) {
      return arr;
    }

    while (picks.length < count) {
      const i = arr.$random();
      picks.push(arr[i]);
      arr.splice(i, 1);
    }

    if (picks.length === 1 && !asArray) {
      return picks[0];
    }
    return picks;
  },
  enumerable: false,
  configurable: true
});

/**
 * For arrays of objects that have an id field find the object that matches
 * the passed in id.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'id', or we don't find the id 'needle' then return
 * undefined
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byId', {
  value(needle, caseInsensitive) {
    return this.byKey('id', needle, caseInsensitive);
  },
  enumerable: false,
  configurable: true
});

/**
 * For arrays of objects that have an name field find the object that matches
 * the passed in name.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'name', or we don't find the name 'needle' then return
 * undefined
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byName', {
  value(needle, caseInsensitive) {
    return this.byKey('name', needle, caseInsensitive);
  },
  enumerable: false,
  configurable: true
});

/**
 * For arrays of objects that have the specified key field find the object that matches
 * the passed in needle value.  If the Array has an item that's not an Object, or an item
 * does not contain a valid key field, or we don't find the name 'needle' then return
 * undefined
 * @param key
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byKey', {
  value(key, needle, caseInsensitive) {
    for (let i = 0; this.length; i++) {
      if (typeof this[i] !== 'object') {
        return undefined;
      }
      if (!this[i][key]) {
        return undefined;
      }
      if (this[i][key] === needle) {
        return this[i];
      }
      if (caseInsensitive && this[i][key].toLowerCase() === needle.toLowerCase()) {
        return this[i];
      }
    }
    return undefined;
  },
  enumerable: false,
  configurable: true
});

/**
 * Colorize a string with a common color name.
 * @param colorName
 */
Object.defineProperty(String.prototype, '$colorize', {
  value(colorName) {
    return colorize(colorName, this);
  },
  enumerable: false,
  configurable: true
});

/**
 * Colorize a string with RGB values
 * @param {Array} rgbArray
 */
Object.defineProperty(String.prototype, '$rgb', {
  value(rgbArray) {
    return colorize.rgb(rgbArray, this);
  },
  enumerable: false,
  configurable: true
});

/**
 * Style a string
 * @param {Object|string} a
 * @param {Array|string} b
 */
Object.defineProperty(String.prototype, '$style', {
  value(a, b) {
    return style(this, a, b);
  },
  enumerable: false,
  configurable: true
});

/**
 * Remove whitespace from a string
 */
Object.defineProperty(String.prototype, '$stripWhitespace', {
  value() {
    return this.replace(/\s/g, '');
  },
  enumerable: false,
  configurable: true
});

/**
 * Emojify a string (parse out and substitute all :emoji:)
 */
Object.defineProperty(String.prototype, '$emojify', {
  value() {
    return emojify(this);
  },
  enumerable: false,
  configurable: true
});

/**
 * Capitalize the first letter of a string
 */
Object.defineProperty(String.prototype, '$capitalize', {
  value() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  },
  enumerable: false,
  configurable: true
});

/**
 * Camelcase a string
 */
Object.defineProperty(String.prototype, '$camelize', {
  value() {
    return camelize(this);
  },
  enumerable: false,
  configurable: true
});

/**
 * Read a JSON file through a sandbox to ensure it is a clean object
 */
JSON.$read = function(path) {
  return vm.runInNewContext(`JSON.parse(fs.readFileSync('${ path }'));`, { fs });
};

JSON.$write = function(path, object) {
  return fs.writeFileSync(path, JSON.stringify(object, null, 2));
};

Object.$clone = function(object, deep = false) {
  if (deep) {
    return deepClone(object);
  }
  return JSON.parse(JSON.stringify(object));
};

Object.$deepClone = function(object) {
  return deepClone(object);
};

Object.$merge = function(objectA, objectB, createNew = false) {
  return merge(objectA, objectB, createNew);
};

/**
 * Add a non-enumerable property to an object.  If the property already exists, just set it
 */
Object.$private = function(body, key, value) {
  if (typeof body !== 'object') {
    return;
  }
  if (body.hasOwnProperty(key)) {
    body[key] = value;
  } else {
    Object.defineProperty(body, key, {
      value,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
};
