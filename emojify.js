'use strict';

const emojis = require('./data/emojis.json');

const emojiAliases = {};

function lookupEmoji (name) {
  let lookup = name.toLowerCase().replace(/\s/g, '_');
  lookup = emojiAliases[lookup] || lookup;

  if (emojis[lookup]) {
    return emojis[lookup].emoji;
  }
  for (const emoji in emojis) {
    if (emoji.tags && emoji.tags.includes(lookup)) {
      return emoji.emoji;
    }
  }

  return name;
}

function emojify (string) {
  if (/[:\s]/.test(string)) {
    return string.replace(/:(.*?):/g, (match, name) => lookupEmoji(name));
  }
  return lookupEmoji(string);
}

emojify.alias = function (to, from) {
  emojiAliases[to] = from;
};
