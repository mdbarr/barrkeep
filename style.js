'use strict';

const colorCodes = require('./colors.json');

const styles = {
  bold: 1,
  faint: 2,
  underline: 4,
  blink: 5,
  reverse: 7
};

function parseFormatString(string) {
  const format = {};
  const items = string.replace(/\s/g, '').split(';');
  for (const item of items) {
    const [ key, value ] = item.split(':');
    format[key] = value;
  }
  return format;
}

function parseColorToCode(color) {
  if (Array.isArray(color)) {
    const [ red, green, blue ] = color;
    return rgbToAnsi256(red, green, blue);
  } else if (typeof color === 'string') {
    color = color.toLowerCase();
    if (color.startsWith('#')) {
      const [ red, green, blue ] = hexToRGB(color);
      return rgbToAnsi256(red, green, blue);
    } else if (colorCodes[color] !== undefined) {
      return colorCodes[color];
    } else if (styles[color] !== undefined) {
      return styles[color];
    }
  }
  return 0;
}

function style(string, a, b) {
  if (typeof a === 'string') {
    if (b === undefined) {
      if (a.includes(':')) {
        return style(string, parseFormatString(a));
      }
      b = a;
      a = 'fg';
    }

    const type = a.toLowerCase();
    const code = parseColorToCode(b);

    if (type === 'fg' || type === 'foreground') {
      string = `\u001b[38;5;${ code }m${ string }\u001b[0m`;
    } else if (type === 'bg' || type === 'background') {
      string = `\u001b[48;5;${ code }m${ string }\u001b[0m`;
    } else if (type === 'style' ) {
      string = `\u001b[${ code }m${ string }\u001b[0m`;
    } else if (b === undefined) {
      const styleCode = parseColorToCode(a);
      string = `\u001b[${ styleCode }m${ string }\u001b[0m`;
    }
  } else if (typeof a === 'object') {
    for (const key in a) {
      string = style(string, key, a[key]);
    }
  }

  string = string.replace(/(\u001b\[0m)+$/, '\u001b[0m');
  return string;
}

module.exports = style;
