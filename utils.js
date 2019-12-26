'use strict';

const crypto = require('crypto');

//////////

const ansiPattern = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
].join('|');

const ansiRegExp = new RegExp(ansiPattern, 'g');

const arrayPartRegExp = /([^]+)\[(\d+)\]$/;

const noop = () => { return undefined; };

//////////

function callback (next, nextTick = false) {
  if (typeof next === 'function') {
    if (nextTick) {
      return function (...args) {
        process.nextTick(() => {
          next(...args);
        });
      };
    }
    return next;
  }
  return noop;
}

function camelize (string) {
  return string.replace(/^.*?:+/, '').
    replace(/[-:]/g, ' ').
    replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (Number(match) === 0) {
        return '';
      }
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function debounce (func, wait) {
  let timeout;

  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait || 500);
  };
}

function decrypt (text, secret, algorithm = 'aes-256-cbc') {
  let decrypted = null;
  secret = secret.replace(/-/g, '').substring(0, 32);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, iv);
  decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([ decrypted, decipher.final() ]).toString();

  return decrypted;
}

function deepClone (object, seen = new WeakMap()) {
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

function deepEqual (actual, expected) {
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

function duration (diff, {
  units = 'd h m', separator = ', ', empty = 'less than a minute'
} = {}) {
  const days = Math.floor(diff / 86400000);
  diff = diff % 86400000;
  const hours = Math.floor(diff / 3600000);
  diff = diff % 3600000;
  const minutes = Math.floor(diff / 60000);
  diff = diff % 60000;
  const seconds = Math.floor(diff / 1000);

  const parts = [];
  if (days > 0 && units.includes('d')) {
    if (days === 1) {
      parts.push(`${ days } day`);
    } else {
      parts.push(`${ days } days`);
    }
  }
  if (hours > 0 && units.includes('h')) {
    if (hours === 1) {
      parts.push(`${ hours } hour`);
    } else {
      parts.push(`${ hours } hours`);
    }
  }
  if (minutes > 0 && units.includes('m')) {
    if (minutes === 1) {
      parts.push(`${ minutes } minute`);
    } else {
      parts.push(`${ minutes } minutes`);
    }
  }

  if (seconds > 0 && units.includes('s')) {
    if (seconds === 1) {
      parts.push(`${ seconds } second`);
    } else {
      parts.push(`${ seconds } seconds`);
    }
  }

  if (parts.length) {
    return parts.join(separator);
  }
  return empty;
}

function encrypt (text, secret, algorithm = 'aes-256-cbc', ivLength = 16) {
  let encrypted = null;
  secret = secret.replace(/-/g, '').substring(0, 32);
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  encrypted = cipher.update(text);
  encrypted = Buffer.concat([ encrypted, cipher.final() ]);
  encrypted = `${ iv.toString('hex') }:${ encrypted.toString('hex') }`;

  return encrypted;
}

function expand (container, object = {}) {
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

function filter (object, check, include = true, path) {
  if (typeof object !== 'object') {
    return object;
  }

  function test (fullpath) {
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
      if (typeof value === 'object') {
        value = filter(value, check, include, fullpath);
        if (Array.isArray(value) && value.length !== 0 ||
            Object.keys(value).length !== 0) {
          clone[prop] = value;
        }
      } else {
        clone[prop] = value;
      }
    }
  }

  return clone;
}

function flatten (object, prefix = '', container = {}) {
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

function formatBytes (bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const kilobyte = 1024;
  const places = decimals + 1;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
  const index = Math.floor(Math.log(bytes) / Math.log(kilobyte));
  return `${ parseFloat((bytes / Math.pow(kilobyte, index)).toFixed(places)) } ${ sizes[index] }`;
}

function formatNumber (value, { numeral = false } = {}) {
  value = Number(value);
  if (Number.isNaN(value) || Number === Infinity) {
    return value.toString();
  }

  const words = [ 'zero', 'one', 'two', 'three', 'four',
    'five', 'six', 'seven', 'eight', 'nine', 'ten' ];

  if (Number.isInteger(value)) {
    if (words[value] && !numeral) {
      return words[value];
    }
  } else {
    value = precisionRound(value);
  }

  return value.toString().
    split(/(?=(?:\d{3})+(?:\.|$))/g).
    join( ',' );
}

function functionType (func) {
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

function merge (objectA, objectB, createNew = false, seen) {
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

function milliseconds (value) {
  if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    let millis = 0;
    value.replace(/(\d+\.?\d*)\s*([mshd]+)/g, (match, time, unit) => {
      time = Number(time) || 0;
      if (unit === 'ms') {
        time *= 1;
      } else if (unit === 's') {
        time *= 1000;
      } else if (unit === 'm') {
        time *= 1000 * 60;
      } else if (unit === 'h') {
        time *= 1000 * 60 * 60;
      } else if (unit === 'd') {
        time *= 1000 * 60 * 60 * 24;
      }

      millis += time;
    });

    return Math.ceil(millis);
  }
  return 0;
}

function once (func) {
  if (typeof func !== 'function') {
    return noop;
  }

  let invoked = false;

  return (...args) => {
    if (!invoked) {
      invoked = true;
      return func(...args);
    }
    return false;
  };
}

function ordinal (value) {
  value = Number(value);

  const tens = value % 10;
  const hundreds = value % 100;

  if (tens === 1 && hundreds !== 11) {
    return `${ value }st`;
  } else if (tens === 2 && hundreds !== 12) {
    return `${ value }nd`;
  } else if (tens === 3 && hundreds !== 13) {
    return `${ value }rd`;
  }
  return `${ value }th`;
}

function precisionRound (number, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function project (object, projection) {
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
      if (typeof projection[key] === 'string') { // key change
        set(result, projection[key], resolve(object, key));
      } else if (typeof projection[key] === 'function') { // value transform
        set(result, key, projection[key](resolve(object, key)));
      } else {
        set(result, key, resolve(object, key)); // simple projection
      }
    }
  }
  return result;
}

function remove (object, propertyPath, removeEmptyContainer = false) {
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

function resolve (object, path = '', delimiter = '.') {
  if (!object || !path) {
    return undefined;
  }

  const parts = path.trim().split(delimiter);

  for (const part of parts) {
    if (arrayPartRegExp.test(part)) {
      const match = part.match(arrayPartRegExp);
      const subpart = match[1];
      const index = Number(match[2]);

      object = object[subpart];
      if (!object) {
        return object;
      }

      object = object[index];
      if (!object) {
        return object;
      }
    } else {
      object = object[part];
      if (!object) {
        return object;
      }
    }
  }
  return object;
}

function resolves (object, path = '', delimiter = '.') {
  if (!object || !path) {
    return false;
  }

  const parts = path.trim().split(delimiter);

  for (const part of parts) {
    if (arrayPartRegExp.test(part)) {
      const match = part.match(arrayPartRegExp);
      const subpart = match[1];
      const index = Number(match[2]);

      object = object[subpart];
      if (!object) {
        return false;
      }

      object = object[index];
      if (!object) {
        return false;
      }
    } else {
      object = object[part];
      if (!object) {
        return false;
      }
    }
  }
  return true;
}

function set (object, propertyPath, value) {
  const parts = propertyPath.trim().split(/\./);
  const key = parts.pop();

  for (const part of parts) {
    if (object[part] === undefined) {
      object[part] = {};
    }

    object = object[part];

    if (!object) {
      return false;
    }
  }

  object[key] = value;

  return true;
}

function setTypes (object) {
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

function sha1 (input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).
    digest('hex');
}

function sha256 (input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha256').update(input).
    digest('hex');
}

function size (object) {
  if (typeof object === 'object') {
    return Object.getOwnPropertyNames(object).length;
  }
  return 0;
}

function stripAnsi (string) {
  return string.replace(ansiRegExp, '');
}

function timestamp (date) {
  if (date) {
    return new Date(date).getTime();
  }
  return Date.now();
}

module.exports = {
  ansiRegExp,
  callback,
  camelize,
  debounce,
  decrypt,
  deepClone,
  deepEqual,
  duration,
  encrypt,
  expand,
  filter,
  flatten,
  formatBytes,
  formatNumber,
  functionType,
  merge,
  milliseconds,
  noop,
  nop: noop,
  once,
  ordinal,
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
  stripAnsi,
  timestamp
};
