'use strict';

const {
  camelize, duration, formatBytes, formatNumber, milliseconds, ordinal, precisionRound,
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
    return formatBytes(Number(value), options);
  },
  camelcase (value) {
    if (!value) {
      return '';
    }
    return camelize(value.toString());
  },
  capitalize (value) {
    if (!value) {
      return '';
    }
    const string = value.toString();
    return string.charAt(0).toUpperCase() + string.slice(1);
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
      replace(/\s+/gu, '-');
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
    return value.replace(/\w\S*/gu, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
  },
  pluralize (word, count, form = '$1s') {
    if (count === 1) {
      return word;
    }
    return form.replace('$1', word);
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
  snakecase (value) {
    if (!value) {
      return '';
    }
    return value.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/gu).
      map(word => word.toLowerCase()).
      join('_');
  },
  titlecase (value = '') {
    return value.split(/[-_.\s]/u).
      map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()).
      join(' ').
      trim();
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
