'use strict';

//////////

const darkTheme = {
  Boolean: '#00875f',
  Date: '#d7d75f',
  Function: '#5fd7ff',
  Map: '#5fd787',
  Null: '#5f00af',
  Number: '#875fd7',
  Promise: '#5bb761',
  PromisePending: '#83c6ea',
  PromiseRejected: '#fc6c86',
  RegExp: '#ff8787',
  Set: '#afd7d7',
  String: '#005fd7',
  Symbol: '#afaf5f',
  Undefined: '#af0087',
  Unknown: '#d78700',
  circular: 'fg: #af0000; style: bold;',
  decoration: '#1c1c1c',
  nonEnumerable: '#ff0087',
  property: '#8a8a8a',
};

const defaults = {
  all: false,
  color: true,
  json: false,
  lineNumbers: false,
  print: true,
  showDepth: true,
  stream: process.stdout,
  theme: darkTheme,
};

const configuration = Object.assign({}, defaults);

function configure (options = {}) {
  Object.assign(configuration, options);
}

function reset () {
  Object.assign({}, defaults);
}

///////////

/**
 * Pretty print a JSON object to the console, if printNonEnumerables
 * is set then loops through all properties on an object and print them.
 * @param {Object} json : the JSON object
 * @param {boolean} printNonEnumerables : print non enumerable properties
 */

console.json = function (json, printNonEnumerables) {
  return prettyPrint(json, {
    all: printNonEnumerables,
    json: true,
    print: true,
  });
};

/**
 * Pretty print to the console.
 * @param anything : any value
 * @param {Object=} options : print options
 */

console.pretty = console.pp = function (...anything) {
  let output = '';
  for (const item of anything) {
    output += prettyPrint(item);
  }
  return output;
};

console.pp.configure = configure;
console.pp.reset = reset;

/**
 * Pretty Print any value with colorization.
 * @param {*} object : any object or value
 * @param {{
 *           all : boolean|undefined,
 *           print : boolean|undefined,
 *           json : boolean|undefined,
 *           lineNumbers : boolean|undefined,
 *           showDepth : boolean|undefined,
 *           theme : Object|undefined }} options
 */

function prettyPrint (object, {
  all = configuration.all,
  color = configuration.color,
  json = configuration.json,
  lineNumbers = configuration.lineNumbers,
  print = configuration.print,
  showDepth = configuration.showDepth,
  stream = configuration.stream,
  theme = configuration.theme,
} = {}) {
  let style;
  if (color && stream && stream.isTTY) {
    style = require('./style');
  } else {
    style = (string) => string;
  }

  function indent (depth) {
    return '  '.repeat(depth);
  }

  function addLineNumbers (output) {
    const lines = output.split(/\n/);
    const padding = lines.length.toString().length + 1;
    let number = 0;
    return lines.map((line) => {
      number++;
      const lineNumber = `${ ' '.repeat(padding - number.toString().length) +
            style(number, theme.property) } \u2502 `;
      return lineNumber + line;
    }).join('\n');
  }

  function prettyPrinter (value, depth, seen, overrideColor) {
    let line = indent(depth);

    seen = new Set(seen);

    if (typeof value === 'object' && seen.has(value)) {
      line += style('[Circular Reference]', theme.circular);
    } else {
      if (typeof value === 'object' && value !== null) {
        seen.add(value);
      }

      if (typeof value === 'string') {
        if (overrideColor && !json) {
          line += style(value, overrideColor);
        } else if (json) {
          line += style(`"${ value }"`, overrideColor || theme.String);
        } else {
          line += style(`'${ value }'`, overrideColor || theme.String);
        }
      } else if (typeof value === 'number') {
        line += style(value, overrideColor || theme.Number);
      } else if (typeof value === 'boolean') {
        line += style(value, overrideColor || theme.Boolean);
      } else if (value === undefined) {
        line += style(value, theme.Undefined);
      } else if (value === null) {
        line += style(value, theme.Null);
      } else if (value instanceof Date) {
        line += style(value.toString(), theme.Date);
      } else if (value instanceof RegExp) {
        line += style(value.toString(), theme.RegExp);
      } else if (typeof value === 'function') {
        line += style(value.toString(), theme.Function);
      } else if (typeof value === 'symbol') {
        line += style(value.toString(), theme.Symbol);
      } else if (Array.isArray(value)) {
        line += '[';
        if (value.length) {
          line += '\n';
        }

        depth++;
        for (let i = 0; i < value.length; i++) {
          const comma = i < value.length - 1 ? ',' : '';
          line += `${ prettyPrinter(value[i], depth, seen) + comma }\n`;
        }
        depth--;
        line += `${ indent(depth) }]`;
      } else if (value instanceof WeakMap) {
        line += `${ style('WeakMap', theme.Map) } {}`;
      } else if (value instanceof Map && !json) {
        line += `${ style('Map', theme.Map) } {`;
        if (value.size) {
          line += '\n';
        }

        depth++;
        let j = 0;
        value.forEach((itemValue, key) => {
          const comma = j < value.size - 1 ? ',' : '';
          line += `${ prettyPrinter(key, depth, seen) }: `;
          line += `${ prettyPrinter(itemValue, depth, seen) + comma }\n`;
          j++;
        });

        depth--;
        line += `${ indent(depth) }}`;
      } else if (value instanceof WeakSet) {
        line += `${ style('WeakSet', theme.Set) } []`;
      } else if (value instanceof Set && !json) {
        line += `${ style('Set', theme.Set) } [`;
        if (value.size) {
          line += '\n';
        }

        depth++;
        let j = 0;
        value.forEach((itemValue) => {
          const comma = j < value.size - 1 ? ',' : '';
          line += `${ prettyPrinter(itemValue, depth, seen) + comma }\n`;
          j++;
        });

        depth--;
        line += `${ indent(depth) }]`;
      } else if (value instanceof Promise) {
        const details = process.binding('util').getPromiseDetails(value);
        if (details[0] === 0) {
          line += `${ style('Promise', theme.Promise) } { ${ style('pending', theme.PromisePending) } }`;
        } else if (details[0] === 1) {
          const result = prettyPrinter(details[1], 0, seen).replace(/\n+$/, '');
          line += `${ style('Promise', theme.Promise) } { ${ result } }`;
        } else if (details[0] === 2) {
          line += `${ style('Promise', theme.Promise) } { ${ style('rejected', theme.PromiseRejected) } }`;
        }
      } else if (typeof value === 'object') {
        line += '{';
        let keys = Object.getOwnPropertyNames(value);
        if (keys.length) {
          line += '\n';
        }

        const enumerables = {};
        keys = keys.filter((key) => {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          enumerables[key] = descriptor.enumerable;
          return descriptor.enumerable === true || all === true;
        });

        depth++;
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          const comma = j < keys.length - 1 ? ',' : '';
          const keyColor = enumerables[key] ? theme.property : theme.nonEnumerable;
          line += `${ prettyPrinter(key, depth, seen, keyColor) }: `;
          line += `${ prettyPrinter(value[key], depth, seen) + comma }\n`;
        }
        depth--;
        line += `${ indent(depth) }}`;
      } else {
        line += style(value.toString(), theme.Unknown);
      }
    }

    return line.replace(/:\s+/g, ': ').
      replace(/([{[])\s+([}\]])/g, '$1$2');
  }
  let output = prettyPrinter(object, 0);

  if (showDepth) {
    output = output.replace(/\n {2}(\s+)/g, (match, spaces) => `\n  ${ spaces.substring(2).split(/ {2}/).
      map(() => style('\u2502 ', theme.decoration)).
      join('') }`);
  }

  if (lineNumbers) {
    output = addLineNumbers(output);
  }

  if (print !== false) {
    stream.write(`${ output }\n`);
  }
  return output;
}

module.exports = prettyPrint;
