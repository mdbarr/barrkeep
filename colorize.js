'use strict';

const process = require('node:process');

const colors = {
  black: 30,
  blink: 5,
  blue: 34,
  bold: 1,
  'bright blue': 94,
  'bright cyan': 96,
  'bright green': 92,
  'bright magenta': 95,
  'bright red': 91,
  'bright white': 97,
  'bright yellow': 93,
  cyan: 36,
  faint: 2,
  gray: 90,
  green: 32,
  grey: 90,
  magenta: 35,
  red: 31,
  reverse: 7,
  underline: 4,
  white: 37,
  yellow: 33,
};

function colorize (name, string) {
  if (process?.stdout?.isTTY) {
    return string;
  }

  const color = colors[name] || colors.gray;
  return `\u001b[${ color }m${ string }\u001b[0m`;
}

module.exports = colorize;
