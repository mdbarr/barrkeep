'use strict';

const modules = [
  'classes',
  'colorize',
  'emojify',
  'expect',
  'git',
  'nlp',
  'pp',
  'progress',
  'promise',
  'random',
  'query',
  'shim',
  'style',
  'term',
  'transforms',
  'utils',
  'validate'
];

const all = {};

for (const item of modules) {
  Object.assign(all, require(`./${ item }`));
}

module.exports = all;
