'use strict';

const process = require('node:process');

const ansiPattern = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
].join('|');

const ansiRegExp = new RegExp(ansiPattern, 'gu');

const arrayPartRegExp = /([^]+)\[(\d+)\]$/u;

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
  return string.replace(/^.*?:+/u, '').
    replace(/[-:]/gu, ' ').
    replace(/(?:^\w|[A-Z]|\b\w|\s+)/gu, (match, index) => {
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
  if (typeof Buffer !== 'undefined' && object instanceof Buffer) {
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

  if (typeof Buffer !== 'undefined' && object instanceof Buffer) {
    return result;
  } else if (object instanceof Map) {
    object.forEach((value, key) => result.set(key, deepClone(value, seen)));
  } else if (object instanceof Set) {
    object.forEach(value => result.add(deepClone(value, seen)));
  } else {
    for (const key in object) {
      if (Object.hasOwn(object, key)) {
        result[key] = deepClone(object[key], seen);
      }
    }
  }

  return result;
}

function deepEqual (actual, expected) {
  if (actual === null || typeof actual === 'undefined' ||
      expected === null || typeof expected === 'undefined') {
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
  return Object.keys(expected).every((i) => properties.indexOf(i) !== -1) &&
    properties.every((i) => deepEqual(actual[i], expected[i]));
}

function distinct (array, selector) {
  if (typeof selector !== 'function') {
    return Array.from(new Set(array));
  }

  const items = new Set();

  return array.filter(item => {
    if (items.has(selector(item))) {
      return false;
    }
    items.add(selector(item));
    return true;
  });
}

function dividePath (path, delimiter = /[.]/u) {
  const parts = [];

  for (const part of path.trim().split(delimiter)) {
    if (arrayPartRegExp.test(part)) {
      const match = part.match(arrayPartRegExp);
      const [ , subpart, index ] = match;
      parts.push(subpart, Number(index));
    } else {
      parts.push(part);
    }
  }

  return parts;
}

function duration (value, {
  units = 'd h m', separator = ', ', empty = 'less than a minute', brief = false,
} = {}) {
  let diff = value;
  const unitList = Array.isArray(units) ? units : units.split(/[\s,]/u);

  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  const millis = diff % 1000;

  const parts = [];

  if (days > 0 && unitList.includes('d')) {
    if (brief) {
      parts.push(`${ days }d`);
    } else if (days === 1) {
      parts.push(`${ days } day`);
    } else {
      parts.push(`${ days } days`);
    }
  }
  if (hours > 0 && (unitList.includes('h') ||
                    unitList.includes('h?') && parts.length === 0)) {
    if (brief) {
      parts.push(`${ hours }h`);
    } else if (hours === 1) {
      parts.push(`${ hours } hour`);
    } else {
      parts.push(`${ hours } hours`);
    }
  }
  if (minutes > 0 && (unitList.includes('m') ||
                      unitList.includes('m?') && parts.length === 0)) {
    if (brief) {
      parts.push(`${ minutes }m`);
    } else if (minutes === 1) {
      parts.push(`${ minutes } minute`);
    } else {
      parts.push(`${ minutes } minutes`);
    }
  }

  if (seconds > 0 && (unitList.includes('s') ||
                      unitList.includes('s?') && parts.length === 0)) {
    if (brief) {
      parts.push(`${ seconds }s`);
    } else if (seconds === 1) {
      parts.push(`${ seconds } second`);
    } else {
      parts.push(`${ seconds } seconds`);
    }
  }

  if (millis > 0 && (unitList.includes('ms') ||
                     unitList.includes('ms?') && parts.length === 0)) {
    if (brief) {
      parts.push(`${ millis }ms`);
    } else if (millis === 1) {
      parts.push(`${ millis } millisecond`);
    } else {
      parts.push(`${ millis } milliseconds`);
    }
  }

  if (parts.length) {
    return parts.join(separator);
  }
  return empty;
}

function expand (container, object = {}) {
  for (const key in container) {
    if (Object.hasOwn(container, key)) {
      const parts = key.split(/\./u);
      const property = parts.pop();

      let chunk = object;
      for (const part of parts) {
        if (!chunk[part]) {
          chunk[part] = {};
        }

        chunk = chunk[part];
      }

      if (property.endsWith('$type')) {
        const name = property.replace(/\$type$/u, '');
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
  }
  return object;
}

function filter (object, check, include = true, path) {
  if (object === null || typeof object !== 'object') {
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

  const clone = Array.isArray(object) ? [ ] : { };
  for (const prop in object) {
    if (Object.hasOwn(object, prop)) {
      const fullpath = path ? `${ path }.${ prop }` : prop;

      let value = object[prop];

      if (test(fullpath)) {
        if (typeof value === 'object') {
          value = filter(value, check, Boolean(include), fullpath);
          if (Array.isArray(value) && value.length !== 0 ||
            Object.keys(value).length !== 0) {
            clone[prop] = value;
          }
        } else {
          clone[prop] = value;
        }
      }
    }
  }

  return clone;
}

function flatten (object, {
  container = {}, delimiter = '.', prefix = '', types = true,
} = {}) {
  if (object === null || typeof object !== 'object') {
    container[prefix] = object;
    return container;
  }

  let pathPrefix = prefix;
  if (prefix.length && prefix !== delimiter) {
    pathPrefix += delimiter;
  }

  for (const key in object) {
    if (Object.hasOwn(object, key)) {
      const pathKey = pathPrefix + key;

      if (Array.isArray(object[key])) {
        if (types) {
          container[`${ pathKey }$type`] = 'Array';
        }

        const array = object[key];
        for (let i = 0; i < array.length; i++) {
          flatten(array[i], {
            container,
            delimiter,
            prefix: `${ pathKey }${ delimiter }${ i }`,
            types,
          });
        }
      } else if (typeof object[key] === 'object' && object[key] !== null) {
        if (types) {
          container[`${ pathKey }$type`] = 'Object';
        }
        flatten(object[key], {
          container,
          delimiter,
          prefix: pathKey,
          types,
        });
      } else {
        container[ pathKey ] = object[key];
      }
    }
  }
  return container;
}

function formatBytes (bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const kilobyte = 1024;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
  const index = Math.floor(Math.log(bytes) / Math.log(kilobyte));
  return `${ parseFloat((bytes / kilobyte ** index).toFixed(decimals)) } ${ sizes[index] }`;
}

function formatNumber (number, { numeral = false } = {}) {
  let value = Number(number);
  if (Number.isNaN(value) || Number === Infinity) {
    return value.toString();
  }

  const words = [
    'zero', 'one', 'two', 'three', 'four',
    'five', 'six', 'seven', 'eight', 'nine', 'ten',
  ];

  if (Number.isInteger(value)) {
    if (words[value] && !numeral) {
      return words[value];
    }
  } else {
    value = precisionRound(value);
  }

  return value.toString().
    split(/(?=(?:\d{3})+(?:\.|$))/gu).
    join( ',' );
}

function functionType (func) {
  const flags = {
    arrow: false,
    bound: false,
    function: func instanceof Function,
    name: null,
    native: false,
    plain: false,
  };

  if (flags.function) {
    flags.name = func.name || '(anonymous)';
    flags.native = func.toString().trim().
      endsWith('() { [native code] }');
    flags.bound = flags.native && flags.name.startsWith('bound ');
    flags.plain = !flags.native && Object.hasOwn(func, 'prototype');
    flags.arrow = !(flags.native || flags.plain);
  }

  return flags;
}

const reRegExpChar = /[\\^$.*+?()[\]{}|]/gu;
const isNativeRegExp = RegExp(`^${
  Function.prototype.toString.call(Object.prototype.hasOwnProperty).
    replace(reRegExpChar, '\\$&').
    replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/gu, '$1.*?')
}$`, 'u');

function isNative (value) {
  return isObject(value) && isNativeRegExp.test(value);
}

function isNumber (value) {
  if (typeof value === 'number') {
    return value - value === 0;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }

  return false;
}

function isObject (value) {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
}

function isPrimitive (value) {
  if (typeof value === 'object') {
    return value === null;
  }
  return typeof value !== 'function';
}

function naturalCompare (inputA, inputB) {
  const { alphabet } = String;
  let stringA = inputA;
  let stringB = inputB;
  let codeA;
  let codeB = 1;
  let posA = 0;
  let posB = 0;
  let i;

  function getCode (str, pos, value) {
    if (value) {
      for (i = pos; getCode(str, i) < 76 && getCode(str, i) > 65;) { ++i; }
      return Number(str.slice(pos - 1, i));
    }

    let code = alphabet && alphabet.indexOf(str.charAt(pos));
    code = code > -1 ? code + 76 : (code = str.charCodeAt(pos) || 0, code < 45 || code > 127) ? code :
      code < 46 ? 65 :
        code < 48 ? code - 1 :
          code < 58 ? code + 18 :
            code < 65 ? code - 11 :
              code < 91 ? code + 11 :
                code < 97 ? code - 37 :
                  code < 123 ? code + 5 :
                    code - 63;

    return code;
  }

  if ((stringA = String(stringA)) !== (stringB = String(stringB))) {
    while (codeB) {
      codeA = getCode(stringA, posA++);
      codeB = getCode(stringB, posB++);

      if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
        codeA = getCode(stringA, posA, posA);
        codeB = getCode(stringB, posB, posA = i);
        posB = i;
      }

      if (codeA !== codeB) { return codeA < codeB ? -1 : 1; }
    }
  }

  return 0;
}

function merge (inputA, objectB, createNew = false, previous) {
  let objectA = inputA;
  if (createNew) {
    objectA = deepClone(objectA);
  }

  const seen = new Set(previous);

  const keys = Object.getOwnPropertyNames(objectB);
  for (const key of keys) {
    if (objectB[key] === null || Array.isArray(objectB[key]) ||
        objectB[key] instanceof Date || objectB[key] instanceof Map ||
        objectB[key] instanceof Set || objectB[key] instanceof RegExp ||
        typeof Buffer !== 'undefined' && objectB[key] instanceof Buffer) {
      if (createNew) {
        objectA[key] = deepClone(objectB[key]);
      } else {
        objectA[key] = objectB[key];
      }
    } else if (typeof objectB[key] === 'object' && !seen.has(objectB[key])) {
      if (typeof objectA[key] === 'object') {
        objectA[key] = merge(objectA[key], objectB[key], createNew, seen);
      } else if (createNew) {
        objectA[key] = deepClone(objectB[key]);
      } else {
        objectA[key] = objectB[key];
      }

      seen.add(objectB[key]);
    } else if (createNew) {
      objectA[key] = deepClone(objectB[key]);
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
    value.replace(/(\d+\.?\d*)\s*([mshdy]+)/gu, (match, part, unit) => {
      let time = Number(part) || 0;
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
      } else if (unit === 'y') {
        time *= 1000 * 60 * 60 * 24 * 365;
      }

      millis += time;
    });

    return Math.ceil(millis);
  }
  return 0;
}

// eslint-disable-next-line no-empty-function
function noop () { }

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
  const number = Number(value);

  const tens = number % 10;
  const hundreds = number % 100;

  if (tens === 1 && hundreds !== 11) {
    return `${ number }st`;
  } else if (tens === 2 && hundreds !== 12) {
    return `${ number }nd`;
  } else if (tens === 3 && hundreds !== 13) {
    return `${ number }rd`;
  }
  return `${ number }th`;
}

async function poll (func, options = {}, done) {
  let fn = func;
  const interval = typeof options === 'number' ? options : options.interval || 1000;
  const retries = typeof options.retries === 'number' ? options.retries : Infinity;
  const validate = typeof options.validate === 'function' ? options.validate : (x) => Boolean(x);

  if (func.length === 1) {
    fn = new Promise((resolve, reject) => {
      func((error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
  }

  let attempts = 0;
  const poller = async (resolve, reject) => {
    const result = await fn();
    attempts++;

    if (validate(result)) {
      return resolve(result);
    } else if (attempts > retries) {
      return reject(new Error('Exceeded max retries'));
    }
    return setTimeout(poller, interval, resolve, reject);
  };

  if (typeof done === 'function') {
    return new Promise(poller).
      then((result) => done(null, result)).
      catch((error) => done(error));
  }
  return new Promise(poller);
}

function precisionRound (number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

function project (object, projection) {
  let sum = 0;
  for (const key in projection) {
    if (Object.hasOwn(projection, key)) {
      sum += projection[key] ? 1 : 0;
    }
  }

  if (sum === 0) {
    const result = deepClone(object);
    for (const key in projection) {
      if (Object.hasOwn(projection, key)) {
        remove(result, key, true);
      }
    }
    return result;
  }

  const result = {};
  for (const key in projection) {
    if (Object.hasOwn(projection, key)) {
      if (typeof projection[key] === 'string') {
        set(result, projection[key], resolve(object, key));
      } else if (typeof projection[key] === 'function') {
        set(result, key, projection[key](resolve(object, key)));
      } else {
        set(result, key, resolve(object, key));
      }
    }
  }
  return result;
}

function random (min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function range (start, end, inc = 1) {
  let increment = inc;

  if (end < start) {
    increment *= -1;
  }

  const result = [ ];

  for (let i = start; i <= end; i += increment) {
    result.push(i);
  }

  return result;
}

function remove (object, propertyPath, removeEmptyContainer = false) {
  if (Array.isArray(propertyPath)) {
    for (const path of propertyPath) {
      remove(object, path, removeEmptyContainer);
    }
    return true;
  }

  const parts = propertyPath.trim().split(/\./u);
  const key = parts.pop();

  let parent;
  let parentKey;
  let current = object;

  for (const part of parts) {
    parent = current;
    parentKey = part;

    current = current[part];

    if (!current) {
      return false;
    }
  }

  delete current[key];

  if (removeEmptyContainer && size(current) === 0) {
    delete parent[parentKey];
  }

  return true;
}

function resolve (object, path = '', delimiter) {
  if (!object || !path) {
    return null;
  }

  const parts = dividePath(path, delimiter);

  let current = object;
  for (const part of parts) {
    current = current[part];
    if (!current) {
      return current;
    }
  }
  return current;
}

function resolves (object, path = '', delimiter) {
  if (!object || !path) {
    return false;
  }

  const parts = dividePath(path, delimiter);

  let current = object;
  for (const part of parts) {
    current = current[part];
    if (!current) {
      return false;
    }
  }
  return true;
}

function set (object, path, value, delimiter) {
  if (!object || !path) {
    return false;
  }

  const parts = dividePath(path, delimiter);
  const key = parts.pop();

  let current = object;
  for (const part of parts) {
    if (typeof current[part] === 'undefined') {
      if (typeof part === 'number') {
        current[part] = [];
      } else {
        current[part] = {};
      }
    }

    current = current[part];

    if (!current) {
      return false;
    }
  }

  current[key] = value;

  return true;
}

function setTypes (object) {
  for (const key in object) {
    if (Object.hasOwn(object, key)) {
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
  }
  return object;
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

function times (count = 1, func, ...args) {
  for (let i = 0; i < count; i++) {
    func(...args);
  }
}

function timestamp (date) {
  if (date) {
    return new Date(date).getTime();
  }
  return Date.now();
}

function toBoolean (value) {
  if (value instanceof Map || value instanceof Set) {
    return value.size > 0;
  } else if (Array.isArray(value)) {
    return value.length > 0;
  } else if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0;
  } else if (typeof value === 'string') {
    const string = value.toLowerCase();

    if (string === 'true' || string === 'yes' || string === '1') {
      return true;
    } else if (string === 'false' || string === 'no' || string === '0') {
      return false;
    }
  }

  return Boolean(value);
}

const regExpPattern = /^\/(.*?)\/([gim]*)$/u;
const escapePattern = /[|\\{}()[\]^$+*?.]/gu;

function toRegExp (string) {
  const parts = string.match(regExpPattern);
  if (parts) {
    return new RegExp(parts[1], parts[2]);
  }
  return new RegExp(`^${ string.replace(escapePattern, '\\$&') }$`, 'u');
}

function unique (array) {
  return Array.from(new Set(array));
}

module.exports = {
  ansiRegExp,
  callback,
  camelize,
  debounce,
  deepClone,
  deepEqual,
  distinct,
  dividePath,
  duration,
  expand,
  filter,
  flatten,
  formatBytes,
  formatNumber,
  functionType,
  isNative,
  isNumber,
  isObject,
  isPrimitive,
  merge,
  milliseconds,
  naturalCompare,
  noop,
  nop: noop,
  once,
  ordinal,
  poll,
  precisionRound,
  project,
  random,
  range,
  remove,
  resolve,
  resolves,
  set,
  setTypes,
  size,
  stripAnsi,
  times,
  timestamp,
  toBoolean,
  toRegExp,
  unique,
};
