'use strict';

const modules = [
  'CappedSet'
];

const classes = {};

for (const item of modules) {
  classes[item] = require(`./${ item }`);
}

module.exports = { classes };
