'use strict';

const {
  camelize, formatBytes, formatNumber, milliseconds, sha1, sha256
} = require('./utils');

module.exports = {
  bytes (value) {
    if (!value) {
      return '';
    }
    value = Number(value);
    return formatBytes(value);
  },
  camelcase (value) {
    if (!value) {
      return '';
    }
    value = value.toString();
    return camelize(value);
  },
  capitalize (value) {
    if (!value) {
      return '';
    }
    value = value.toString();
    return value.charAt(0).toUpperCase() + value.slice(1);
  },
  lowercase (value) {
    if (!value) {
      return '';
    }
    return value.toString().toLowerCase();
  },
  milliseconds (value) {
    if (!value) {
      return 0;
    }
    return milliseconds(value);
  },
  number (value) {
    return formatNumber(value);
  },
  reverse (value) {
    if (!value) {
      return '';
    }
    return value.
      toString().
      split('').
      reverse().
      join('');
  },
  sha1 (value = '') {
    return sha1(value);
  },
  sha256 (value = '') {
    return sha256(value);
  },
  trim (value) {
    if (!value) {
      return '';
    }
    return value.toString().trim();
  },
  uppercase (value) {
    if (!value) {
      return '';
    }
    return value.toString().toUpperCase();
  }
};
