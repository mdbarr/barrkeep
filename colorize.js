'use strict';

const colors = {
  bold: 1,
  faint: 2,
  underline: 4,
  blink: 5,
  reverse: 7,

  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,

  gray: 90,
  grey: 90,
  'bright red': 91,
  'bright green': 92,
  'bright yellow': 93,
  'bright blue': 94,
  'bright magenta': 95,
  'bright cyan': 96,
  'bright white': 97,
};

function colorize (name, string) {
  if (global.flags && global.flags.noColor) {
    return string;
  }

  const color = colors[name] || colors.gray;
  return `\u001b[${ color }m${ string }\u001b[0m`;
}

module.exports = colorize;
