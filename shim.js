/* eslint-disable no-extend-native */
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');

const query = require('./query');
const style = require('./style');
const emojify = require('./emojify');
const colorize = require('./colorize');

const {
  camelize, deepClone, distinct, expand, filter, flatten, formatBytes,
  formatNumber, merge, precisionRound, project, random, range, remove,
  resolve, resolves, set, setTypes, size, unique,
} = require('./utils');

Math.$random = random;
Math.$round = precisionRound;

Number.$asBytes = formatBytes;
Number.$format = formatNumber;
Number.$range = range;

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

//////////

Object.defineProperty(Array.prototype, '$all', {
  configurable: true,
  enumerable: false,
  value (predicate) {
    return this.reduce((acc, value) => acc && predicate(value), true);
  },
});

/**
 * For arrays of objects that have an id field find the object that matches
 * the passed in id.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'id', or we don't find the id 'needle' then return
 * null
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byId', {
  configurable: true,
  enumerable: false,
  value (needle, caseInsensitive) {
    return this.byKey('id', needle, caseInsensitive);
  },
});

/**
 * For arrays of objects that have an name field find the object that matches
 * the passed in name.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'name', or we don't find the name 'needle' then return
 * null
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byName', {
  configurable: true,
  enumerable: false,
  value (needle, caseInsensitive) {
    return this.byKey('name', needle, caseInsensitive);
  },
});

/**
 * For arrays of objects that have the specified key field find the object that matches
 * the passed in needle value.  If the Array has an item that's not an Object, or an item
 * does not contain a valid key field, or we don't find the name 'needle' then return
 * null
 * @param key
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, '$byKey', {
  configurable: true,
  enumerable: false,
  value (key, needle, caseInsensitive) {
    for (let i = 0; this.length; i++) {
      if (typeof this[i] !== 'object') {
        return null;
      }
      if (!this[i][key]) {
        return null;
      }
      if (this[i][key] === needle) {
        return this[i];
      }
      if (caseInsensitive && this[i][key].toLowerCase() === needle.toLowerCase()) {
        return this[i];
      }
    }
    return null;
  },
});

Object.defineProperty(Array.prototype, '$distinct', {
  configurable: true,
  enumerable: false,
  value (selector) {
    return distinct(this, selector);
  },
});

Object.defineProperty(Array.prototype, '$first', {
  configurable: true,
  enumerable: false,
  value () {
    if (this.length) {
      return this[0];
    }
    return null;
  },
});

Object.defineProperty(Array.prototype, '$last', {
  configurable: true,
  enumerable: false,
  value () {
    if (this.length) {
      return this[this.length - 1];
    }
    return null;
  },
});

Object.defineProperty(Array.prototype, '$none', {
  configurable: true,
  enumerable: false,
  value (predicate) {
    return this.reduce((acc, value) => !acc && !predicate(value), false);
  },
});

Object.defineProperty(Array.prototype, '$partition', {
  configurable: true,
  enumerable: false,
  value (predicate) {
    return this.reduce((result, item) => {
      const [ listA, listB ] = result;

      if (predicate(item) === true) {
        listA.push(item);
      } else {
        listB.push(item);
      }

      return result;
    }, [ [], [] ]);
  },
});

Object.defineProperty(Array.prototype, '$pick', {
  configurable: true,
  enumerable: false,
  value (count, asArray) {
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
});

Object.defineProperty(Array.prototype, '$random', {
  configurable: true,
  enumerable: false,
  value () {
    return this[Math.floor(Math.random() * this.length)];
  },
});

Object.defineProperty(Array.prototype, '$shuffle', {
  configurable: true,
  enumerable: false,
  value () {
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
});

Object.defineProperty(Array.prototype, '$some', {
  configurable: true,
  enumerable: false,
  value (predicate) {
    return this.reduce((acc, value) => acc || predicate(value), false);
  },
});

Object.defineProperty(Array.prototype, '$unique', {
  configurable: true,
  enumerable: false,
  value () {
    return unique(this);
  },
});

//////////

/**
 * Colorize a string with a common color name.
 * @param colorName
 */
Object.defineProperty(String.prototype, '$colorize', {
  configurable: true,
  enumerable: false,
  value (colorName) {
    return colorize(colorName, this);
  },
});

/**
 * Colorize a string with RGB values
 * @param {Array} rgbArray
 */
Object.defineProperty(String.prototype, '$rgb', {
  configurable: true,
  enumerable: false,
  value (rgbArray) {
    return colorize.rgb(rgbArray, this);
  },
});

/**
 * Style a string
 * @param {Object|string} a
 * @param {Array|string} b
 */
Object.defineProperty(String.prototype, '$style', {
  configurable: true,
  enumerable: false,
  value (input, value) {
    return style(this, input, value);
  },
});

/**
 * Remove whitespace from a string
 */
Object.defineProperty(String.prototype, '$stripWhitespace', {
  configurable: true,
  enumerable: false,
  value () {
    return this.trim().replace(/\s/gu, '');
  },
});

/**
 * Emojify a string (parse out and substitute all :emoji:)
 */
Object.defineProperty(String.prototype, '$emojify', {
  configurable: true,
  enumerable: false,
  value () {
    return emojify(this);
  },
});

/**
 * Capitalize the first letter of a string
 */
Object.defineProperty(String.prototype, '$capitalize', {
  configurable: true,
  enumerable: false,
  value () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  },
});

/**
 * Camelcase a string
 */
Object.defineProperty(String.prototype, '$camelize', {
  configurable: true,
  enumerable: false,
  value () {
    return camelize(this);
  },
});

/**
 * Read a JSON file through a sandbox to ensure it is a clean object
 */
JSON.$read = function (path) {
  return vm.runInNewContext(`JSON.parse(fs.readFileSync('${ path }'));`, { fs });
};

JSON.$write = function (path, object) {
  return fs.writeFileSync(path, JSON.stringify(object, null, 2));
};

Object.$clone = function (object, deep = false) {
  if (deep) {
    return deepClone(object);
  }
  return JSON.parse(JSON.stringify(object));
};

Object.$deepClone = function (object) {
  return deepClone(object);
};

Object.$merge = function (objectA, objectB, createNew = false) {
  return merge(objectA, objectB, createNew);
};

/**
 * Add a non-enumerable property to an object.  If the property already exists, just set it
 */
Object.$private = function (body, key, value) {
  if (typeof body !== 'object') {
    return;
  }
  if (Object.hasOwn(body, key)) {
    body[key] = value;
  } else {
    Object.defineProperty(body, key, {
      configurable: true,
      enumerable: false,
      value,
      writable: true,
    });
  }
};
