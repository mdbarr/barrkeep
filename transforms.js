'use strict';

const { pp } = require('./pp');
const {
  camelize, duration, formatBytes, formatNumber, milliseconds, ordinal,
  precisionRound, sha1, sha256,
} = require('./utils');

module.exports = {
  binary (value) {
    if (!value) {
      return '';
    }
    return Number(value).toString(2);
  },
  bytes (value, options) {
    if (!value) {
      return '';
    }
    value = Number(value);
    return formatBytes(value, options);
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
  degrees (radians = 0) {
    return radians * (180 / Math.PI);
  },
  duration (value, options) {
    if (!value) {
      return '';
    }
    return duration(value, options);
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
  kebabcase (value) {
    if (!value) {
      return '';
    }
    return value.toString().trim().
      toLowerCase().
      replace(/\s+/g, '-');
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
  number (value, options = { numeral: true }) {
    return formatNumber(value, options);
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
  pascalcase (value) {
    if (!value) {
      return '';
    }
    return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
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
      showDepth: true,
    });
  },
  radians (degrees = 0) {
    return degrees * (Math.PI / 180);
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
  sentencecase (value) {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.substring(1).toLowerCase();
  },
  sha1 (value = '') {
    return sha1(value);
  },
  sha256 (value = '') {
    return sha256(value);
  },
  snakecase (value) {
    if (!value) {
      return '';
    }
    return value.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).
      map(word => word.toLowerCase()).
      join('_');
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
  },
};
