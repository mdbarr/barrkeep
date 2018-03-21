'use strict';

const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const child_process = require('child_process');

const colorCodes = require('./colors.json');
const emojis = require('./emojis.json');
const SHOW_CURSOR = '\u001b[?25h';
const HIDE_CURSOR = '\u001b[?25l';

const gitAuthorEmailCommand = 'git log --format="%ae" -n 1';
const gitBlameCommand = 'git blame --porcelain';
const gitBlameEmailClean = /[<>]/g;
const gitBranchChangesCommand = 'git diff --numstat $(git merge-base master HEAD)';
const gitBranchCommand = 'git rev-parse --abbrev-ref HEAD';
const gitChangeSetCommand = 'git log --first-parent --pretty="format:%H, %aE, %cN, %s"';
const gitChangeSetRegExp = /^(\w{40}),\s(.*?),\s(.*?),\s(.*)$/;
const gitHashCommand = 'git rev-parse HEAD';
const gitMergeBaseCommand = 'git merge-base master HEAD';
const gitOrigin = /^origin\//;
const gitStatusCommand = 'git status --branch --porcelain --untracked-files=all';

const emailRegExp = /(@.*)$/;

//////////////////////////////////////////////////
// Shims

// Promise extension for a delay
Promise.delay = Promise.prototype.delay = function(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(timeout);
    }, timeout);
  });
};

Promise.sleep = Promise.prototype.sleep = Promise.prototype.delay;

// Validator promises
global.validation = {
  ok: function(value) {
    return Promise.resolve((value) ? value : true);
  },
  fail: function(reason) {
    return Promise.reject((reason) ? reason : 'validation failed');
  }
};

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
 * For arrays of objects that have an id field find the object that matches
 * the passed in id.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'id', or we don't find the id 'needle' then return
 * undefined
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, 'byId', {
  value: function(needle, caseInsensitive) {
    return this.byKey('id', needle, caseInsensitive);
  },
  enumerable: false
});

/**
 * For arrays of objects that have an name field find the object that matches
 * the passed in name.  If the Array has an item that's not an Object, or an item
 * does not contain a valid 'name', or we don't find the name 'needle' then return
 * undefined
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, 'byName', {
  value: function(needle, caseInsensitive) {
    return this.byKey('name', needle, caseInsensitive);
  },
  enumerable: false
});

/**
 * For arrays of objects that have the specified key field find the object that matches
 * the passed in needle value.  If the Array has an item that's not an Object, or an item
 * does not contain a valid key field, or we don't find the name 'needle' then return
 * undefined
 * @param key
 * @param needle
 * @param caseInsensitive
 * @returns {*}
 */
Object.defineProperty(Array.prototype, 'byKey', {
  value: function(key, needle, caseInsensitive) {
    for (let i = 0; this.length; i++) {
      if (typeof this[i] !== 'object') {
        return undefined;
      }
      if (!this[i][key]) {
        return undefined;
      }
      if (this[i][key] === needle) {
        return this[i];
      }
      if (caseInsensitive && this[i][key].toLowerCase() === needle.toLowerCase()) {
        return this[i];
      }
    }
    return undefined;
  },
  enumerable: false
});

/**
 * Colorize a string with a common color name.
 * @param colorName
 */
Object.defineProperty(String.prototype, 'colorize', {
  value: function(colorName) {
    return colorize(colorName, this);
  },
  enumerable: false
});

/**
 * Colorize a string with RGB values
 * @param {Array} rgbArray
 */
Object.defineProperty(String.prototype, 'rgb', {
  value: function(rgbArray) {
    return colorize.rgb(rgbArray, this);
  },
  enumerable: false
});

/**
 * Style a string
 * @param {Object|string} a
 * @param {Array|string} b
 */
Object.defineProperty(String.prototype, 'style', {
  value: function(a, b) {
    return style(this, a, b);
  },
  enumerable: false
});

/**
 * Remove whitespace from a string
 */
Object.defineProperty(String.prototype, 'stripWhitespace', {
  value: function() {
    return this.replace(/\s/g, '');
  },
  enumerable: false
});

/**
 * Emojify a string (parse out and substitute all :emoji:)
 */
Object.defineProperty(String.prototype, 'emojify', {
  value: function() {
    return emojify(this);
  },
  enumerable: false
});

/**
 * Capitalize the first letter of a string
 */
Object.defineProperty(String.prototype, 'capitalize', {
  value: function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  },
  enumerable: false
});

/**
 * Camelcase a string
 */
Object.defineProperty(String.prototype, 'camelize', {
  value: function() {
    return camelize(this);
  },
  enumerable: false
});

/**
 * Read a JSON file through a sandbox to ensure it is a clean object
 */
JSON.read = function(path) {
  return vm.runInNewContext(`JSON.parse(fs.readFileSync('${ path }'));`, {
    fs: fs
  });
};

JSON.write = function(path, object) {
  return fs.writeFileSync(path, JSON.stringify(object, null, 2));
};

/**
 * Promise retry mechanisms
 */
function timeoutPromise(promise, options, value, context) {
  return new Promise(function(resolve, reject) {
    try {
      promise.bind(context)(value).then(function (result) {
        resolve(result);
      }, function(error) {
        options.lastError = error;
        setTimeout(function() {
          reject(error);
        }, options.delay);
      });
    } catch (error) {
      options.lastError = error;
      setTimeout(function() {
        reject(error);
      }, options.delay);
    }
  });
}

/**
 * Retry a promise
 */
global.retry = function(promise, options, value, context) {
  options = parseRetryOptions(options);
  options.start = options.start || Date.now();
  if (typeof options.counter !== 'number') {
    options.counter = -1;
  }
  let errorMessage;
  if (options.timeout > 0 && Date.now() > options.start + options.timeout) {
    errorMessage = 'timeout of ' + options.timeout + ' ms exceeded (' + options.counter + ' attempts).';
  }
  if (options.count > 0 && options.counter >= (options.count - 1)) {
    errorMessage = 'retry count of ' + options.count + ' exceeded.';
  }
  if (errorMessage) {
    const error = new Error(errorMessage);
    if (options.lastError) {
      error.stack = options.lastError.stack;
    }
    throw error;
  }

  options.counter++;

  return timeoutPromise(promise, options, value, context).
    then(function(result) {
      return result;
    }, function(error) {
      if (error && (error.name === 'ReferenceError' || error.name === 'SyntaxError' ||
                    error.name === 'TypeError' || error.name === 'RangeError' ||
                    error.name === 'EvalError' || error.name === 'InternalError' ||
                    error.name === 'URIError' || error.name === 'UnhandledUrlParameterError' ||
                    error.name === 'RetryError' || (error.group && error.group === 'RetryError'))) {
        throw error;
      } else {
        return retry(promise, options, value, context);
      }
    });
};

// Promise extension for retry as a then-able
Promise.prototype.thenRetry = function(promise, options) {
  return this.then(function(value) {
    return global.retry(promise, options, value);
  });
};

Math.rand = function(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

Object.clone = function(object, deep = false) {
  if (deep) {
    return deepClone(object);
  } else {
    return JSON.parse(JSON.stringify(object));
  }
};

Object.deepClone = function(object) {
  return deepClone(object);
};

Object.merge = function(objectA, objectB, createNew = false) {
  return merge(objectA, objectB, createNew);
};

Object.resolve = function(object, path) {
  const parts = path.stripWhitespace().split(/\./);

  for (const part of parts) {
    object = object[part];
    if (!object) {
      return undefined;
    }
  }
  return object;
};

//////////////////////////////////////////////////
// Utilities

function deepClone(object, seen = new WeakMap()) {
  // Primitives (treat Functions as primitives)
  if (Object(object) !== object || object instanceof Function) {
    return object;
  }

  // Cyclic references
  if (seen.has(object)) {
    return seen.get(object);
  }

  let result;
  if (object instanceof Buffer) {
    result = Buffer.from(object);
  } else if (object instanceof Date) {
    result = new Date(object);
  } else if (object instanceof RegExp) {
    result = new RegExp(object.source, object.flags);
  } else if (object.constructor) {
    result = new object.constructor();
  } else {
    result = Object.create(null);
  }

  seen.set(object, result);

  if (object instanceof Buffer) {
    return result;
  } else if (object instanceof Map) {
    object.forEach((value, key) => result.set(key, deepClone(value, seen)));
  } else if (object instanceof Set) {
    object.forEach(value => result.add(deepClone(value, seen)));
  } else {
    for (const key in object) {
      result[key] = deepClone(object[key], seen);
    }
  }

  return result;
}

function merge(objectA, objectB, createNew = false, seen = new WeakSet()) {
  if (createNew) {
    objectA = deepClone(objectA);
  }

  const keys = Object.getOwnPropertyNames(objectB);
  for (const key of keys) {
    if (typeof objectB[key] === 'object' && !seen.has(objectB[key])) {
      if (typeof objectA[key] === 'object') {
        objectA[key] = merge(objectA[key], objectB[key], createNew, seen);
      } else {
        if (createNew) {
          objectA[key] = deepClone(objectB[key]);
        } else {
          objectA[key] = objectB[key];
        }
      }
      seen.add(objectB[key]);
    } else {
      objectA[key] = objectB[key];
    }
  }
  return objectA;
}

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

const colors = {
  'bold': 1,
  'faint': 2,
  'underline': 4,
  'blink': 5,
  'reverse': 7,

  'black': 30,
  'red': 31,
  'green': 32,
  'yellow': 33,
  'blue': 34,
  'magenta': 35,
  'cyan': 36,
  'white': 37,

  'gray': 90,
  'grey': 90,
  'bright red': 91,
  'bright green': 92,
  'bright yellow': 93,
  'bright blue': 94,
  'bright magenta': 95,
  'bright cyan': 96,
  'bright white': 97
};

function colorize(name, string) {
  if (global.flags.noColor) {
    return string;
  }

  const color = colors[name] || colors.gray;
  return `\u001b[${ color }m${ string }\u001b[0m`;
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

function gitBranch() {
  let branch = process.env.GIT_BRANCH || process.env.BRANCH_NAME;
  if (!branch) {
    branch = child_process.execSync(gitBranchCommand, {
      cwd: process.cwd()
    }).toString();
  }
  branch = branch || 'detached HEAD';
  return branch.trim().replace(gitOrigin, '');
}

function gitHash() {
  return child_process.execSync(gitHashCommand, {
    cwd: process.cwd()
  }).toString().trim();
}

function gitAuthorEmail() {
  return child_process.execSync(gitAuthorEmailCommand, {
    cwd: process.cwd()
  }).toString().trim();
}

function gitBranchChanges() {
  return child_process.execSync(gitBranchChangesCommand, {
    cwd: process.cwd()
  }).toString().trim().
      split('\n').
      map(function(line) {
        const [ additions, deletions, file ] = line.split(/\s+/);
        return {
          file: file,
          additions: additions,
          deletions: deletions
        };
      });
}

function gitBlame(file, lineNumber) {
  const summary = child_process.execSync(`${ gitBlameCommand } -L${ lineNumber},${ lineNumber } ${ file }`, {
    cwd: process.cwd()
  }).toString().trim().split(/\n/);

  const hashInformation = summary[0].split(/\s+/);
  const blame = {
    hash: hashInformation[0],
    additions: hashInformation[1],
    deletions: hashInformation[2],
    author: { },
    committer: {}
  };

  for (let i = 1; i < summary.length - 1; i++) {
    const [ , type, value ] = summary[i].match(/^(.*?)\s(.*)$/);

    switch (type) {
      case 'author':
        blame.author.name = value;
        break;
      case 'author-mail':
        blame.author.email = value.replace(gitBlameEmailClean, '');
        break;
      case 'author-time':
        blame.author.date = new Date(Number(value) * 1000);
        break;
      case 'committer':
        blame.committer.name = value;
        break;
      case 'committer-mail':
        blame.committer.email = value.replace(gitBlameEmailClean, '');
        break;
      case 'committer-time':
        blame.committer.date = new Date(Number(value) * 1000);
        break;
      case 'summary':
        blame.summary = value;
      case 'previous':
        const previousInformation = value.split(/\s+/);
        blame.previous = {
          hash: previousInformation[0],
          file: previousInformation[1]
        };
        break;
      case 'filename':
        blame.file = value;
        break;
    }
  }

  blame.line = summary[summary.length - 1].slice(1);

  return blame;
}

function gitAddNotes(message, prefix, force) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ' --ref=' + prefix;
    }

    gitNotesCommand += ` add -m "${ message }"`;

    if (force) {
      gitNotesCommand += ' -f';
    }

    child_process.execSync(gitNotesCommand, {
      cwd: process.cwd(),
      stdio: 'ignore'
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitRemoveNotes(prefix) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ' --ref=' + prefix;
    }
    gitNotesCommand += ' remove';

    child_process.execSync(gitNotesCommand, {
      cwd: process.cwd(),
      stdio: 'ignore'
    });

    return true;
  } catch (error) {
    return false;
  }
}

function gitShowNotes(prefix) {
  try {
    let gitNotesCommand = 'git notes';
    if (prefix) {
      gitNotesCommand += ' --ref=' + prefix;
    }
    gitNotesCommand += ' show';

    const notes = child_process.execSync(gitNotesCommand, {
      cwd: process.cwd(),
      stdio: [ 'pipe', 'pipe', 'ignore' ]
    }).toString().trim();

    if (notes.startsWith('error: No note found')) {
      return null;
    } else {
      return notes;
    }
  } catch (error) {
    return null;
  }
}

function gitStatus() {
  const status = child_process.execSync(gitStatusCommand, {
    cwd: process.cwd()
  }).toString().trim().split('\n');

  let [ branch, ...changes ] = status;

  branch = branch.replace('## ', '');
  changes = changes.map(function (item) {
    return item.replace(/^[ ][MD]\s+(.*)$/, '$1 (modified)').
      replace(/^M[ MD]\s+(.*)$/, '$1 (modified in index)').
      replace(/^A[ MD]\s+(.*)$/, '$1 (added)').
      replace(/^D[ M]\s+(.*)$/, '$1 (deleted)').
      replace(/^R[ MD]\s+(.*)$/, '$1 (renamed)').
      replace(/^C[ MD]\s+(.*)$/, '$1 (copied)').
      replace(/^[MARC][ ]\s+(.*)$/, '$1 (index and work tree matches)').
      replace(/^[ MARC]M\s+(.*)$/, '$1 (work tree changed since index)').
      replace(/^[ MARC]D\s+(.*)$/, '$1 (deleted in work tree)').
      replace(/^DD\s+(.*)$/, '$1 (unmerged, both deleted)').
      replace(/^AU\s+(.*)$/, '$1 (unmerged, added by us)').
      replace(/^UD\s+(.*)$/, '$1 (unmerged, deleted by them)').
      replace(/^UA\s+(.*)$/, '$1 (unmerged, added by them)').
      replace(/^DU\s+(.*)$/, '$1 (unmerged, deleted by us)').
      replace(/^AA\s+(.*)$/, '$1 (unmerged, both added)').
      replace(/^UU\s+(.*)$/, '$1 (unmerged, both modified)').
      replace(/^\?\?\s+(.*)$/, '$1 (untracked)').
      replace(/^!!\s+(.*)$/, '$1 (ignored)');
  }).sort();

  return {
    branch: branch,
    changes: changes,
    clean: !changes.length
  };
}

function gitMergeBase() {
  try {
    return child_process.execSync(gitMergeBaseCommand, {
      cwd: process.cwd(),
      stdio: [ 'pipe', 'pipe', 'ignore' ]
    }).toString().trim();
  } catch (error) { // Likely a shallow clone
    return null;
  }
}

function gitChangeSet(initialCommit) {
  let command = gitChangeSetCommand;
  if (initialCommit) {
    command += ` "${ initialCommit }..HEAD"`;
  } else if (process.env.LAST_SUCCESSFUL_COMMIT) {
    command += ` "${ process.env.LAST_SUCCESSFUL_COMMIT }..HEAD"`;
  } else {
    return null;
  }

  const changes = child_process.execSync(command, {
    cwd: process.cwd()
  }).toString().trim().split('\n');

  const changeSet = {};

  changes.forEach(function(change) {
    if (gitChangeSetRegExp.test(change)) {
      const [ , hash, email, name, title ] = change.match(gitChangeSetRegExp);

      if (emailRegExp.test(email)) {
        const id = email.replace(emailRegExp, '').toLowerCase();

        changeSet[id] = changeSet[id] || {
          id: id,
          name: name,
          email: email,
          changes: []
        };

        changeSet[id].changes.push({
          short: hash.substring(0, 12),
          hash: hash,
          title: title
        });
      }
    }
  });

  return changeSet;
}

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
    return ('  ').repeat(depth);
  }

  function addLineNumbers(output) {
    const lines = output.split(/\n/);
    const padding = lines.length.toString().length + 1;
    let number = 0;
    return lines.map(function(line) {
      number++;
      const lineNumber = ' '.repeat(padding - number.toString().length) +
            colorize('grey', number) + ' \u2502 ';
      return lineNumber + line;
    }).join('\n');
  }

  function prettyPrinter(value, depth, seen = new WeakSet(), overrideColor) {
    let line = indent(depth);

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
          line += colorize(overrideColor || 'green', '"' + value + '"');
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
          const comma = (i < value.length - 1) ? ',' : '';
          line += prettyPrinter(value[i], depth, seen) + comma + '\n';
        }
        depth--;
        line += indent(depth) + ']';
      } else if (value instanceof Map && !json) {
        line += 'Map {';
        if (value.size) {
          line += '\n';
        }

        depth++;
        let j = 0;
        value.forEach(function(itemValue, key) {
          const comma = (j < value.size - 1) ? ',' : '';
          line += prettyPrinter(key, depth, seen) + ': ';
          line += prettyPrinter(itemValue, depth, seen) + comma + '\n';
          j++;
        });

        depth--;
        line += indent(depth) + '}';
      } else if (value instanceof Set && !json) {
        line += 'Set [';
        if (value.size) {
          line += '\n';
        }

        depth++;
        let j = 0;
        value.forEach(function(itemValue) {
          const comma = (j < value.size - 1) ? ',' : '';
          line += prettyPrinter(itemValue, depth, seen) + comma + '\n';
          j++;
        });

        depth--;
        line += indent(depth) + ']';
      } else if (typeof value === 'object') {
        line += '{';
        let keys = Object.getOwnPropertyNames(value);
        if (keys.length) {
          line += '\n';
        }

        const enumerables = {};
        keys = keys.filter(function(key) {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          enumerables[key] = descriptor.enumerable;
          return (descriptor.enumerable === true || all === true);
        });

        depth++;
        for (let j = 0; j < keys.length; j++) {
          const key = keys[j];
          const comma = (j < keys.length - 1) ? ',' : '';
          const keyColor = enumerables[key] ? 'gray' : 'red';
          line += prettyPrinter(key, depth, seen, keyColor) + ': ';
          line += prettyPrinter(value[key], depth, seen) + comma + '\n';
        }
        depth--;
        line += indent(depth) + '}';
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

//////////////////////////////

/**
 * Add a non-enumerable property to an object.  If the property already exists, just set it
 */
function addNonEnumerableProperty(body, key, value) {
  if (typeof body !== 'object') {
    return;
  }
  if (body.hasOwnProperty(key)) {
    body[key] = value;
  } else {
    Object.defineProperty(body, key, {
      value: value,
      enumerable: false,
      writable: true
    });
  }
}

//////////////////////////////

function parseRetryOptions(options) {
  options = options || { };

  if (options.parsed) {
    return options;
  }

  options = options.clone();

  if (typeof options === 'number') {
    if (options < 1000) {
      options = {
        count: options
      };
    } else {
      options = {
        timeout: options
      };
    }
  }
  // don't use count by default
  if (typeof options.count !== 'number') {
    options.count = -1;
  }
  // 100ms default delay
  if (typeof options.delay !== 'number') {
    options.delay = 100;
  }
  // 30s default timeout
  if (typeof options.timeout !== 'number') {
    if (options.count > 0) {
      options.timeout = 0;
    } else {
      options.timeout = 30000;
    }
  }

  options.parsed = true;
  return options;
}

//////////////////////////////////////////////////////////////////////

function ProgressBar({
  format, stream, total, width, complete, incomplete, head, clear, tokens
}) {
  this.stream = stream || process.stderr;
  this.format = format || '[$progress]';
  this.total = total || 10;
  this.value = 0;
  this.width = width || this.total;
  this.characters = {
    complete: complete || '=',
    incomplete: incomplete || ' ',
    head: head || '>'
  };
  this.clear = (clear === undefined) ? false : clear;
  this.tokens = tokens || { };

  this.complete = false;
  this.lastUpdate = false;
}

ProgressBar.prototype.progress = function(options) {
  if (this.complete) {
    return;
  }

  options = options || {};
  if (typeof options === 'number') {
    options = {
      increment: options
    };
  }

  options.increment = Number(options.increment) || 1;

  if (this.value === 0) {
    this.start = new Date();
  }

  this.value += options.increment;
  this.tokens = Object.assign(this.tokens, options.tokens || {});

  this.render();

  if (this.value >= this.total) {
    this.complete = true;
    this.done();
  }
};

ProgressBar.prototype.render = function() {
  const self = this;

  if (!self.stream.isTTY) {
    return;
  }

  let ratio = self.value / self.total;
  ratio = Math.min(Math.max(ratio, 0), 1);
  const percent = Math.floor(ratio * 100);
  const elapsed = new Date() - self.start;
  const eta = (percent === 100) ? 0 : elapsed * (self.total / self.value - 1);
  const rate = self.value / (elapsed / 1000);

  let string = self.format.
      replace(/\$value/g, self.value).
      replace(/\$total/g, self.total).
      replace(/\$elapsed/g, isNaN(elapsed) ? '0.0' : (elapsed / 1000).toFixed(1)).
      replace(/\$eta/g, (isNaN(eta) || !isFinite(eta)) ? '0.0' : (eta / 1000).toFixed(1)).
      replace(/\$percent/g, percent.toFixed(0) + '%').
      replace(/\$rate/g, Math.round(rate)).
      replace(/\$(.+?)\b/g, function(match, token) {
        if (self.tokens[token]) {
          return self.tokens[token];
        } else {
          if (token === 'progress') {
            return '$progress';
          } else {
            return '';
          }
        }
      });

  const columns = Math.max(0, self.stream.columns - string.replace(/\$progress/g, '').length);
  const width = Math.min(self.width, columns);
  const completeLength = Math.round(width * ratio);

  const complete = self.characters.complete.repeat(Math.max(0, completeLength)).
        replace(/.$/, (self.value >= self.total) ? self.characters.complete : self.characters.head);
  const incomplete = self.characters.incomplete.repeat(Math.max(0, width - completeLength));

  string = string.replace('$progress', complete + incomplete).
    replace(/\$progress/g, '');

  if (self.lastUpdate !== string) {
    self.stream.cursorTo(0);
    self.stream.write(`${ HIDE_CURSOR }${ string }`);
    self.stream.clearLine(1);
    self.lastUpdate = string;
  }
};

ProgressBar.prototype.done = function() {
  this.stream.write(SHOW_CURSOR);
  if (this.clear) {
    if (this.stream.clearLine) {
      this.stream.clearLine();
      this.stream.cursorTo(0);
    }
  } else {
    this.stream.write('\n');
  }
};

ProgressBar.prototype.reset = function() {
  this.value = 0;
  this.complete = 0;
  this.tokens = { };
};

//////////////////////////////////////////////////////////////////////

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
      } else {
        b = a;
        a = 'fg';
      }
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
};

//////////////////////////////////////////////////////////////////////

const emojiAliases = {};

function lookupEmoji(name) {
  let lookup = name.toLowerCase().replace(/\s/g, '_');
  lookup = emojiAliases[lookup] || lookup;

  if (emojis[lookup]) {
    return emojis[lookup].emoji;
  } else {
    for (const emoji in emojis) {
      if (emoji.tags && emoji.tags.includes(lookup)) {
        return emoji.emoji;
      }
    }
  }
  return name;
}

function emojify(string) {
  if (/[:\s]/.test(string)) {
    return string.replace(/:(.*?):/g, function(match, name) {
      return lookupEmoji(name);
    });
  } else {
    return lookupEmoji(string);
  }
}

emojify.alias = function(to, from) {
  emojiAliases[to] = from;
};

//////////////////////////////////////////////////////////////////////

module.exports = {
  ProgressBar: ProgressBar,
  addNonEnumerableProperty: addNonEnumerableProperty,
  camelize: camelize,
  colorize: colorize,
  emojify: emojify,
  formatBytes: formatBytes,
  generateAlphaNumeric: generateAlphaNumeric,
  generatePassword: generatePassword,
  generateShortStringWithPrefix: generateShortStringWithPrefix,
  generateStringWithPrefix: generateStringWithPrefix,
  getSHA1Hex: getSHA1Hex,
  gitAddNotes: gitAddNotes,
  gitAuthorEmail: gitAuthorEmail,
  gitBlame: gitBlame,
  gitBranch: gitBranch,
  gitBranchChanges: gitBranchChanges,
  gitChangeSet: gitChangeSet,
  gitHash: gitHash,
  gitMergeBase: gitMergeBase,
  gitRemoveNotes: gitRemoveNotes,
  gitShowNotes: gitShowNotes,
  gitStatus: gitStatus,
  hexToRGB: hexToRGB,
  merge: merge,
  millis: millis,
  prettyPrint: prettyPrint,
  rgbToAnsi256: rgbToAnsi256,
  style: style
};
