'use strict';

//////////

const languages = { english: require('./data/english') };

const configuration = {
  language: languages.english,
  stripStopWords: false
};

//////////

function configure ({
  language, stripStopwords
} = {}) {
  if (language && languages[language]) {
    configuration.language = languages[language];
  }
  if (stripStopwords !== undefined) {
    configuration.stripStopwords = stripStopwords;
  }

  return configuration;
}

function isNotStopword (word) {
  return !configuration.language.stopwordsRegExp.test(word);
}

function isStopword (word) {
  return configuration.language.stopwordsRegExp.test(word);
}

function stringEditDistance (a, b, { ignoreWhitespace = false } = {}) {
  if (ignoreWhitespace) {
    a = a.trim().replace(/\s+/g, ' ');
    b = b.trim().replace(/\s+/g, ' ');
  }

  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const matrix = [];

  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [ i ];
  }

  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}

function tokenize (string, {
  tokenizer = configuration.language.tokenizerRegExp,
  stripStopwords = configuration.stripStopwords
} = {}) {
  let tokens = string.toString().
    match(tokenizer);

  if (stripStopwords) {
    tokens = tokens.filter(token => { return isNotStopword(token); });
  }

  return tokens;
}

//////////

module.exports = {
  configure,
  isNotStopword,
  isStopword,
  stringEditDistance,
  tokenize
};
