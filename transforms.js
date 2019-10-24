'use strict';

const { pp } = require('./pp');
const {
  camelize, duration, formatBytes, formatNumber, milliseconds, ordinal,
  precisionRound, sha1, sha256
} = require('./utils');

module.exports = {
  binary (value) {
    if (!value) {
      return '';
    }
    return Number(value).toString(2);
  },
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
  currency (value, symbol = '$') {
    if (!value) {
      return '';
    }
    return `${ symbol }${ precisionRound(value) }`;
  },
  duration (value) {
    if (!value) {
      return '';
    }
    return duration(value);
  },
  hexadecimal (value) {
    if (!value) {
      return '';
    }
    return Number(value).toString(16);
  },
  json (value, indent = 2) {
    if (value) {
      return '';
    }
    return JSON.stringify(value, null, indent);
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
  octal (value) {
    if (!value) {
      return '';
    }
    return Number(value).toString(8);
  },
  ordinal (value) {
    if (!value) {
      return '';
    }
    return ordinal(value);
  },
  pluralize (word, count, form = '$1s') {
    if (count === 1) {
      return word;
    }
    return form.replace('$1', word);
  },
  pp (value) {
    if (!value) {
      return '';
    }
    return pp(value, {
      all: false,
      color: false,
      json: false,
      lineNumbers: false,
      print: false,
      showDepth: true
    });
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
