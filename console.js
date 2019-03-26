'use strict';

/**
 * Pretty print a JSON object to the console, if printNonEnumerables
 * is set then loops through all properties on an object and print them.
 * @param {Object} json : the JSON object
 * @param {boolean} printNonEnumerables : print non enumerable properties
 */

console.json = function(json, printNonEnumerables) {
  return prettyPrint(json, {
    all: printNonEnumerables,
    json: true,
    print: true
  });
};

/**
 * Pretty print to the console.
 * @param anything : any value
 * @param {Object=} options : print options
 */

console.pretty = console.pp = function(anything, options) {
  return prettyPrint(anything, options);
};

/**
 * Pretty Print any value with colorization.
 * @param {*} object : any object or value
 * @param {{
 *           all : boolean|undefined,
 *           print : boolean|undefined,
 *           json : boolean|undefined,
 *           lineNumbers : boolean|undefined }} options
 */
function prettyPrint(object, {
  all = false, print = true, json = false, lineNumbers = false
} = {}) {
  function indent(depth) {
    return '  '.repeat(depth);
  }

  function addLineNumbers(output) {
    const lines = output.split(/\n/);
    const padding = lines.length.toString().length + 1;
    let number = 0;
    return lines.map((line) => {
      number++;
      const lineNumber = `${ ' '.repeat(padding - number.toString().length) +
            colorize('grey', number) } \u2502 `;
      return lineNumber + line;
    }).join('\n');
  }

  function prettyPrinter(value, depth, seen, overrideColor) {
    let line = indent(depth);

    seen = new Set(seen);

    if (typeof value === 'object' && seen.has(value)) {
      line += colorize('bright red', '[Circular Reference]');
    } else {
      if (typeof value === 'object' && value !== null) {
        seen.add(value);
      }

      if (typeof value === 'string') {
        if (overrideColor && !json) {
          line += colorize(overrideColor, value);
        } else {
          line += colorize(overrideColor || 'green', `"${ value }"`);
        }
      } else if (typeof value === 'number') {
        line += colorize(overrideColor || 'yellow', value);
      } else if (typeof value === 'boolean') {
        line += colorize(overrideColor || 'cyan', value);
      } else if (value === undefined || value === null) {
        line += colorize(overrideColor || 'magenta', value);
      } else if (value instanceof Date || value instanceof RegExp ||
               typeof value === 'function') {
        line += colorize('blue', value.toString());
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
      } else if (value instanceof Map && !json) {
        line += 'Map {';
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
      } else if (value instanceof Set && !json) {
        line += 'Set [';
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
          const keyColor = enumerables[key] ? 'gray' : 'red';
          line += `${ prettyPrinter(key, depth, seen, keyColor) }: `;
          line += `${ prettyPrinter(value[key], depth, seen) + comma }\n`;
        }
        depth--;
        line += `${ indent(depth) }}`;
      } else {
        line += colorize('bright red', value.toString());
      }
    }

    return line.replace(/:\s+/g, ': ').
      replace(/([{[])\s+([}\]])/g, '$1$2');
  }

  let output = prettyPrinter(object, 0);
  if (lineNumbers) {
    output = addLineNumbers(output);
  }

  if (print !== false) {
    console.log(output);
  }
  return output;
}
