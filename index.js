'use strict';

const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const child_process = require('child_process');

Math.rand = function(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function getSHA1Hex(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).digest('hex');
}

function hexToRGB(string) {
  let red = 255;
  let green = 255;
  let blue = 255;

  string = string.replace(/^#/, '');

  if (string.length === 3) {
    [ red, green, blue ] = string.match(/(\w)/g).
      map(function(hex) {
        return parseInt(hex.repeat(2), 16);
      });
  } else if (string.length === 6) {
    [ red, green, blue ] = string.match(/(\w\w)/g).
      map(hex => parseInt(hex, 16));
  }

  return [ red, green, blue ];
}

function rgbToAnsi256(red, green, blue) {
  if (red === green && green === blue) {
    if (red < 8) {
      return 16;
    }

    if (red > 248) {
      return 231;
    }

    return Math.round(((red - 8) / 247) * 24) + 232;
  }

  const ansi = 16
      + (36 * Math.round(red / 255 * 5))
      + (6 * Math.round(green / 255 * 5))
      + Math.round(blue / 255 * 5);

  return ansi;
}

colorize.rgb = function(color, string) {
  let red;
  let green;
  let blue;

  if (Array.isArray(color)) {
    [ red, green, blue ] = color;
  } else {
    [ red, green, blue ] = hexToRGB(color);
  }

  const ansi = rgbToAnsi256(red, green, blue);

  return `\u001b[38;5;${ ansi }m${ string }\u001b[0m`;
};

colorize.frequency = 0.1;
colorize.seed = Math.rand(0, 256);
colorize.spread = 8.0;
colorize.cycle = function(frequency, i) {
  const red = Math.round(Math.sin(frequency * i + 0) * 127 + 128);
  const green = Math.round(Math.sin(frequency * i + 2 * Math.PI / 3) * 127 + 128);
  const blue = Math.round(Math.sin(frequency * i + 4 * Math.PI / 3) * 127 + 128);

  return [ red, green, blue ];
};

//////////////////////////////////////////////////


function formatBytes(bytes, decimals) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const kilobyte = 1024;
  const places = decimals + 1 || 3;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
  const index = Math.floor(Math.log(bytes) / Math.log(kilobyte));
  return parseFloat((bytes / Math.pow(kilobyte, index)).toFixed(places)) + ' ' + sizes[index];
}


function camelize(string) {
  return string.replace(/^.*?:+/, '').
    replace(/[-:]/g, ' ').
    replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
      if (+match === 0) {
        return '';
      }
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function generateStringWithPrefix(prefix) {
  return prefix + Math.rand(100000000, 999999999) + Date.now();
}

function generateShortStringWithPrefix(prefix) {
  return prefix + Math.rand(100000000, 999999999);
}

function generatePassword() {
  const possibleSymbols = '!@#$%^&*()_+{}[]<>?,./|';
  const possibleCapsLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const possibleLowerLetters = 'abcdefghijklmnopqrstuvwxyz';
  const possibleNumbers = '1234567890';
  const passwordLength = Math.rand(3, 8);

  let password = '';
  for (let i = 0; i < passwordLength; i++) {
    password += possibleSymbols.charAt(Math.rand(0, possibleSymbols.length - 1)) +
      possibleCapsLetters.charAt(Math.rand(0, possibleCapsLetters.length - 1)) +
      possibleLowerLetters.charAt(Math.rand(0, possibleLowerLetters.length - 1)) +
      possibleNumbers.charAt(Math.rand(0, possibleNumbers.length - 1));
  }
  return password;
}

function generateAlphaNumeric(length) {
  const possibleAlphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let generated = '';
  for (let i = 0; i < length; i++) {
    generated += possibleAlphaNumerics.charAt(Math.rand(0, possibleAlphaNumerics.length - 1));
  }
  return generated;
}

//////////////////////////////

const TIME_UNIT = {
  MS: 'ms',
  S: 's',
  M: 'm',
  H: 'h',
  D: 'd'
};

const REGEX_LOOKUP = {
  ms: '^mill*',
  s: '^sec*',
  m: '^min*',
  h: '^hour*',
  d: '^day*'
};

const VALUE_MILLIS = {
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24
};

addNonEnumerableProperty(TIME_UNIT, 'REGEX', REGEX_LOOKUP);
addNonEnumerableProperty(TIME_UNIT, 'MILLIS', VALUE_MILLIS);
function getTimeOptions(timeUnit, options) {
  if (options[timeUnit]) {
    return options[timeUnit] * TIME_UNIT.MILLIS[timeUnit];
  }
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      const regex = new RegExp(TIME_UNIT.REGEX[timeUnit]);
      if (key.match(regex)) {
        return options[key] * TIME_UNIT.MILLIS[timeUnit];
      }
    }
  }
  return 0;
}

/**
 * Convert a duration to milliseconds.  Can either pass in "unit (String)", "length (Number)",
 * or a TimeDuration json object specifying multiple durations that will be added together
 * @param {{
 *    millis: Number|undefined
 *    seconds: Number|undefined
 *    minutes: Number|undefined
 *    hours: Number|undefined
 *    days: Number|undefined }} options
 * @param length {Number|undefined}
 * @returns {number}
 */
function millis(options, length) {
  let useOptions = options;
  if (typeof options === 'string') {
    useOptions = { };
    useOptions[options] = length;
  }
  let ms = 0;
  for (const key in TIME_UNIT) {
    ms += getTimeOptions(TIME_UNIT[key], useOptions);
  }
  return ms;
}
