'use strict';

const colorize = require('./colorize');
const colorCodes = require('../data/colors.json');

const styles = {
  blink: 5,
  bold: 1,
  faint: 2,
  reverse: 7,
  strike: 9,
  underline: 4,
};

function hexToRGB (input) {
  let red = 255;
  let green = 255;
  let blue = 255;

  const string = input.toString().replace(/^#/u, '');

  if (string.length === 3) {
    [ red, green, blue ] = string.match(/(\w)/gu).
      map((hex) => parseInt(hex.repeat(2), 16));
  } else if (string.length === 6) {
    [ red, green, blue ] = string.match(/(\w\w)/gu).
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

function parseColorToCode (name) {
  let color = name;
  if (Array.isArray(color)) {
    const [ red, green, blue ] = color;
    return rgbToAnsi256(red, green, blue);
  } else if (typeof color === 'string') {
    color = color.toLowerCase().replace(/[-_\s/]/gu, '');
    if (color.startsWith('#')) {
      const [ red, green, blue ] = hexToRGB(color);
      return rgbToAnsi256(red, green, blue);
    } else if (typeof colorCodes[color] !== 'undefined') {
      if (typeof colorCodes[color] === 'string' && colorCodes[color].startsWith('#')) {
        const [ red, green, blue ] = hexToRGB(colorCodes[color]);
        return rgbToAnsi256(red, green, blue);
      }
      return colorCodes[color];
    } else if (typeof styles[color] !== 'undefined') {
      return styles[color];
    }
  }
  return 0;
}

function style (string, input = 'fg:white', value) {
  let styling = input;
  let output = '';

  if (typeof styling === 'object' && styling !== null) {
    let combined = '';
    for (const key of Object.keys(styling)) {
      combined += `${ key }:${ styling[key] };`;
    }
    styling = combined;
  }

  if (typeof styling === 'string' && typeof value === 'string') {
    styling = `${ styling }:${ value }`;
  }

  if (!styling.includes(':')) {
    styling = `fg:${ styling }`;
  }

  styling = styling.replace(/\s/gu, '').toLowerCase();

  const items = styling.split(/;/u);

  for (const item of items) {
    if (!item) {
      continue;
    }

    const [ type, codes ] = item.split(/:/u);

    const values = codes.split(/,/u);

    for (const part of values) {
      const code = parseColorToCode(part);

      switch (type) {
        case 'fg':
        case 'foreground':
          output += `\u001b[38;5;${ code }m`;
          break;
        case 'bg':
        case 'background':
          output += `\u001b[48;5;${ code }m$`;
          break;
        case 'style':
          output += `\u001b[${ code }m`;
          break;
        default:
          output += `\u001b[38;5;${ code }m`;
          break;
      }
    }
  }

  if (!output.endsWith('\u001b[0m')) {
    output += `${ string }\u001b[0m`;
  }

  return output;
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
