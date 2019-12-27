'use strict';

// eslint-disable-next-line no-useless-escape
const tokenizerRegExp = /\w+-\w+|\w+'\w+|\w+|[~`!@#$%^&*()_\-+={}\[\]|\\;:'"<>,.?/]/g;

//////////

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

function tokenize (string, tokenizer = tokenizerRegExp) {
  return string.toString().
    match(tokenizer);
}

//////////

module.exports = {
  stringEditDistance,
  tokenize
};
