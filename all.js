'use strict';

const modules = [
  'colorize',
  'emojify',
  'expect',
  'git',
  'pp',
  'progress',
  'promise',
  'random',
  'query',
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
