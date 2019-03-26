'use strict';

const emojis = require('./emojis.json');

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
