'use strict';

const { resolve } = require('./utils');

const isOperator = (str) => { return str.startsWith('$'); };

function equals(a, b) {
  if (typeof a === 'string' && b instanceof RegExp) {
    return b.test(a);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!equals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  return a === b;
}

function query(value, filter = {}) {
  if (typeof filter === 'function') {
    return Boolean(filter(value));
  }

  let result = 1;

  for (const key in filter) {
    if (isOperator(key)) {
      if (key === '$eq') {
        result &= value === filter[key];
      } else if (key === '$ne') {
        result &= value !== filter[key];
      } else if (key === '$like') {
        result &= equals(value, filter[key]);
      } else if (key === '$regexp' || key === '$regex') {
        if (filter[key] instanceof RegExp) {
          result &= filter[key].test(value);
        } else {
          result &= false;
        }
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
      } else if (key === '$and') {
        for (const and of filter[key]) {
          result &= query(value, and);
          if (result === 0) {
            break;
          }
        }
      } else if (key === '$or') {
        let intermediate = 0;
        for (const or of filter[key]) {
          intermediate |= query(value, or);
          if (intermediate) {
            break;
          }
        }
        result &= intermediate;
      } else if (key === '$nor') {
        let intermediate = 0;
        for (const nor of filter[key]) {
          intermediate |= query(value, nor);
        }
        result &= ! intermediate;
      } else if (key === '$not') {
        result &= !query(value, filter[key]);
      } else if (key === '$type') {
        result &= typeof value === filter[key];
      } else if (key === '$exists') {
        result &= value !== undefined;
      } else if (key === '$size') {
        if (Array.isArray(value) && value.length === filter[key]) {
          return true;
        } else if (typeof value === 'object' &&
                   Object.keys(value).length === filter[key]) {
          return true;
        }
        return false;
      } else if (key === '$elemMatch') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (query(item, filter[key])) {
              return true;
            }
          }
        }
        return false;
      } else if (key === '$all') {
        if (Array.isArray(value)) {
          for (const item of value) {
            result &= query(item, filter[key]);
            if (result === 0) {
              return false;
            }
          }
        } else {
          return false;
        }
      }
    } else if (Array.isArray(filter[key])) {
      result &= equals(resolve(value, key), filter[key]);
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
