'use strict';

const isOperator = (x) => { return x.startsWith('$'); };

function resolve(object, path = '') {
  if (!object || !path) {
    return undefined;
  }

  const parts = path.trim().split(/\./);

  for (const part of parts) {
    object = object[part];
    if (!object) {
      return undefined;
    }
  }
  return object;
}

function equals(a, b) {
  if (typeof a === 'string' && b instanceof RegExp) {
    return b.test(a);
  }

  return a === b;
}

function query(value, filter = {}) {
  let result = 1;

  for (const key in filter) {
    if (isOperator(key)) {
      if (key === '$eq') {
        result &= value === filter[key];
      } else if (key === '$ne') {
        result &= value !== filter[key];
      } else if (key === '$like') {
        result = result & equals(value, filter[key]);
      } else if (key === '$gt') {
        result &= value > filter[key];
      } else if (key === '$gte') {
        result &= value >= filter[key];
      } else if (key === '$lt') {
        result &= value < filter[key];
      } else if (key === '$lte') {
        result &= value <= filter[key];
      } else if (key === '$in') {
        result &= filter[key].includes(value);
      } else if (key === '$nin') {
        result &= ! filter[key].includes(value);
      }
    } else if (typeof filter[key] === 'object') {
      result &= query(resolve(value, key), filter[key]);
    } else {
      result &= equals(resolve(value, key), filter[key]);
    }

    if (result === 0) {
      return false;
    }
  }

  return Boolean(result);
}

module.exports = query;
