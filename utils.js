'use strict';

const crypto = require('crypto');

function deepClone(object, seen = new WeakMap()) {
  // Primitives (treat Functions as primitives)
  if (Object(object) !== object || object instanceof Function) {
    return object;
  }

  // Cyclic references
  if (seen.has(object)) {
    return seen.get(object);
  }

  let result;
  if (object instanceof Buffer) {
    result = Buffer.from(object);
  } else if (object instanceof Date) {
    result = new Date(object);
  } else if (object instanceof RegExp) {
    result = new RegExp(object.source, object.flags);
  } else if (object.constructor) {
    result = new object.constructor();
  } else {
    result = Object.create(null);
  }

  seen.set(object, result);

  if (object instanceof Buffer) {
    return result;
  } else if (object instanceof Map) {
    object.forEach((value, key) => { return result.set(key, deepClone(value, seen)); });
  } else if (object instanceof Set) {
    object.forEach(value => { return result.add(deepClone(value, seen)); });
  } else {
    for (const key in object) {
      result[key] = deepClone(object[key], seen);
    }
  }

  return result;
}

function merge(objectA, objectB, createNew = false, seen) {
  if (createNew) {
    objectA = deepClone(objectA);
  }

  seen = new Set(seen);

  const keys = Object.getOwnPropertyNames(objectB);
  for (const key of keys) {
    if (typeof objectB[key] === 'object' && !seen.has(objectB[key])) {
      if (typeof objectA[key] === 'object') {
        objectA[key] = merge(objectA[key], objectB[key], createNew, seen);
      } else if (createNew) {
        objectA[key] = deepClone(objectB[key]);
      } else {
        objectA[key] = objectB[key];
      }

      seen.add(objectB[key]);
    } else {
      objectA[key] = objectB[key];
    }
  }
  return objectA;
}

function resolve(object, path = '', delimiter = '.') {
  if (!object || !path) {
    return undefined;
  }

  const parts = path.trim().split(delimiter);

  for (const part of parts) {
    object = object[part];
    if (!object) {
      return object;
    }
  }
  return object;
}

function resolves(object, path = '', delimiter = '.') {
  if (!object || !path) {
    return false;
  }

  const parts = path.trim().split(delimiter);

  for (const part of parts) {
    object = object[part];
    if (!object) {
      return false;
    }
  }
  return true;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const kilobyte = 1024;
  const places = decimals + 1;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
  const index = Math.floor(Math.log(bytes) / Math.log(kilobyte));
  return `${ parseFloat((bytes / Math.pow(kilobyte, index)).toFixed(places)) } ${ sizes[index] }`;
}

function camelize(string) {
  return string.replace(/^.*?:+/, '').
    replace(/[-:]/g, ' ').
    replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (Number(match) === 0) {
        return '';
      }
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function sha1(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).
    digest('hex');
}

function sha256(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha256').update(input).
    digest('hex');
}

const noop = () => { return undefined; };

function callback(next, synchronousContext) {
  if (typeof next === 'function') {
    if (synchronousContext) {
      return function(...args) {
        setImmediate(() => {
          next(...args);
        });
      };
    }
    return next;
  }
  return noop;
}

function timestamp(date) {
  if (date) {
    return new Date(date).getTime();
  }
  return Date.now();
}

function precisionRound(number, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function functionType(func) {
  const flags = {
    function: func instanceof Function,
    name: undefined,
    native: false,
    bound: false,
    plain: false,
    arrow: false
  };

  if (flags.function) {
    flags.name = func.name || '(anonymous)';
    flags.native = func.toString().trim().
      endsWith('() { [native code] }');
    flags.bound = flags.native && flags.name.startsWith('bound ');
    flags.plain = !flags.native && func.hasOwnProperty('prototype');
    flags.arrow = !(flags.native || flags.plain);
  }

  return flags;
}

function set(object, propertyPath, value) {
  const parts = propertyPath.trim().split(/\./);
  const key = parts.pop();

  for (const part of parts) {
    object = object[part];

    if (!object) {
      return false;
    }
  }

  object[key] = value;

  return true;
}

function remove(object, propertyPath, removeEmptyContainer = false) {
  const parts = propertyPath.trim().split(/\./);
  const key = parts.pop();

  let parent;
  let parentKey;

  for (const part of parts) {
    parent = object;
    parentKey = part;

    object = object[part];

    if (!object) {
      return false;
    }
  }

  delete object[key];

  if (removeEmptyContainer && size(object) === 0) {
    delete parent[parentKey];
  }

  return true;
}

function flatten(object, prefix = '', container = {}) {
  if (typeof object !== 'object') {
    container[prefix] = object;
    return container;
  }

  if (prefix.length) {
    prefix += '.';
  }

  for (const key in object) {
    const pathKey = prefix + key;

    if (Array.isArray(object[key])) {
      container[`${ pathKey }$type`] = 'Array';
      const array = object[key];
      for (let i = 0; i < array.length; i++) {
        flatten(array[i], `${ pathKey }.${ i }`, container);
      }
    } else if (typeof object[key] === 'object' && object[key] !== null) {
      container[`${ pathKey }$type`] = 'Object';
      flatten(object[key], pathKey, container);
    } else {
      container[ pathKey ] = object[key];
    }
  }
  return container;
}

function expand(container, object = {}) {
  for (const key in container) {
    const parts = key.split(/\./);
    const property = parts.pop();

    let chunk = object;
    for (const part of parts) {
      if (!chunk[part]) {
        chunk[part] = {};
      }

      chunk = chunk[part];
    }

    if (property.endsWith('$type')) {
      const name = property.replace(/\$type$/, '');
      if (container[key] === 'Object') {
        chunk[name] = {};
      } else if (container[key] === 'Array') {
        chunk[name] = [];
      } else {
        // Unknown type
      }
    } else {
      chunk[property] = container[key];
    }
  }
  return object;
}

function setTypes(object) {
  for (const key in object) {
    const value = object[key];

    if (parseInt(value, 10).toString() === value) {
      object[key] = parseInt(value, 10);
    } else if (parseFloat(value, 10).toString() === value) {
      object[key] = parseFloat(value, 10);
    } else if (value === 'true') {
      object[key] = true;
    } else if (value === 'false') {
      object[key] = false;
    }
  }
  return object;
}

function size(object) {
  if (typeof object === 'object') {
    return Object.getOwnPropertyNames(object).length;
  }
  return 0;
}

function project(object, projection) {
  let sum = 0;
  for (const key in projection) {
    sum += projection[key] ? 1 : 0;
  }

  if (sum === 0) { // selective removal
    const result = deepClone(object);
    for (const key in projection) {
      remove(result, key, true);
    }
    return result;
  }
  // selective inclusion
  const result = {};

  for (const key in projection) {
    if (projection[key]) {
      set(result, key, resolve(object, key));
    }
  }
  return result;
}

function filter(object, check, include = true, path) {
  if (typeof object !== 'object') {
    return object;
  }

  function test(fullpath) {
    if (Array.isArray(check)) {
      if (check.includes(fullpath)) {
        return include;
      }
      return !include;
    } else if (check instanceof Map || check instanceof Set ||
               check instanceof WeakMap || check instanceof WeakSet) {
      if (check.has(fullpath)) {
        return include;
      }
      return !include;
    } else if (typeof check === 'function') {
      if (check(fullpath)) {
        return include;
      } return !include;
    } else if (check instanceof RegExp) {
      if (check.test(fullpath)) {
        return include;
      }
      return !include;
    } else if (typeof check === 'object') {
      if (resolve(check, fullpath)) {
        return include;
      }
      return !include;
    }
    return !include;
  }

  include = Boolean(include);

  const clone = Array.isArray(object) ? [ ] : { };
  for (const prop in object) {
    const fullpath = path ? `${ path }.${ prop }` : prop;

    let value = object[prop];

    if (test(fullpath)) {
      clone[prop] = value;
    }

    if (typeof value === 'object') {
      value = filter(value, check, include, fullpath);
      if (Array.isArray(value) && value.length !== 0 ||
          Object.keys(value).length !== 0) {
        clone[prop] = value;
      }
    }
  }

  return clone;
}

function deepEqual(actual, expected) {
  if (actual === null || actual === undefined ||
      expected === null || expected === undefined) {
    return actual === expected;
  }

  if (actual.constructor !== expected.constructor) {
    return false;
  }

  if (actual instanceof Function) {
    return actual === expected;
  }

  if (actual instanceof RegExp) {
    return actual === expected;
  }

  if (actual instanceof Set) {
    if (actual.size !== expected.size) {
      return false;
    }

    for (const entry of actual) {
      if (!expected.has(entry)) {
        return false;
      }
    }

    return true;
  }

  if (actual instanceof Map) {
    if (actual.size !== expected.size) {
      return false;
    }

    for (const [ key, value ] of actual) {
      if (!expected.has(key) &&
          deepEqual(value, expected.get(key))) {
        return false;
      }
    }

    return true;
  }

  if (actual === expected || actual.valueOf() === expected.valueOf()) {
    return true;
  }

  if (Array.isArray(actual) && actual.length !== expected.length) {
    return false;
  }

  if (actual instanceof Date) {
    return false;
  }

  if (!(actual instanceof Object)) {
    return false;
  }

  if (!(expected instanceof Object)) {
    return false;
  }

  const properties = Object.keys(actual);
  return Object.keys(expected).every((i) => {
    return properties.indexOf(i) !== -1;
  }) && properties.every((i) => {
    return deepEqual(actual[i], expected[i]);
  });
}

module.exports = {
  callback,
  camelize,
  deepClone,
  deepEqual,
  expand,
  filter,
  flatten,
  formatBytes,
  functionType,
  merge,
  noop,
  nop: noop,
  precisionRound,
  project,
  remove,
  resolve,
  resolves,
  set,
  setTypes,
  sha1,
  sha256,
  size,
  timestamp
};
