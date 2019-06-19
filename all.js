'use strict';

const modules = [
  'colorize',
  'emojify',
  'git',
  'pp',
  'progress',
  'promise',
  'random',
  'shim',
  'style',
  'utils',
  'validate'
];

const all = {};

for (const item of modules) {
  Object.assign(all, require(`./${ item }`));
}

module.exports = all;
