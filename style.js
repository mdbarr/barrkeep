'use strict';

const colorize = require('./colorize');
const colorCodes = require('./data/colors.json');

const styles = {
  bold: 1,
  faint: 2,
  underline: 4,
  blink: 5,
  reverse: 7,
};

function hexToRGB (string) {
  let red = 255;
  let green = 255;
  let blue = 255;

  string = string.replace(/^#/, '');

  if (string.length === 3) {
    [ red, green, blue ] = string.match(/(\w)/g).
      map((hex) => parseInt(hex.repeat(2), 16));
  } else if (string.length === 6) {
    [ red, green, blue ] = string.match(/(\w\w)/g).
      map(hex => parseInt(hex, 16));
  }

  return [ red, green, blue ];
}

function rgbToAnsi256 (red, green, blue) {
  if (red === green && green === blue) {
    if (red < 8) {
      return 16;
    }

    if (red > 248) {
      return 231;
    }

    return Math.round((red - 8) / 247 * 24) + 232;
  }

  const ansi = 16 +
      36 * Math.round(red / 255 * 5) +
      6 * Math.round(green / 255 * 5) +
      Math.round(blue / 255 * 5);

  return ansi;
}

function parseFormatString (string) {
  const format = {};
  const items = string.replace(/\s/g, '').split(';');
  for (const item of items) {
    const [ key, value ] = item.split(':');
    format[key] = value;
  }
  return format;
}

function parseColorToCode (color) {
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

function style (string, a, b) {
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

colorize.rgb = function (color, string) {
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
colorize.seed = Math.floor(Math.random() * 256);
colorize.spread = 8.0;
colorize.cycle = function (frequency, i) {
  const red = Math.round(Math.sin(frequency * i + 0) * 127 + 128);
  const green = Math.round(Math.sin(frequency * i + 2 * Math.PI / 3) * 127 + 128);
  const blue = Math.round(Math.sin(frequency * i + 4 * Math.PI / 3) * 127 + 128);

  return [ red, green, blue ];
};

module.exports = style;
