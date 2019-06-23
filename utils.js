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

function formatBytes(bytes, decimals) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const kilobyte = 1024;
  const places = decimals + 1 || 3;
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

module.exports = {
  callback,
  camelize,
  deepClone,
  formatBytes,
  merge,
  noop,
  nop: noop,
  precisionRound,
  resolve,
  resolves,
  sha1,
  sha256,
  timestamp
};
