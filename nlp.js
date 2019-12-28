'use strict';

//////////

const languages = { english: require('./data/english') };

const configuration = {
  language: languages.english,
  stripPunctuation: false,
  stripStopwords: false
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

function dipthongH (character) {
  character = toCharacter(character);

  return character === 'C' ||
    character === 'G' ||
    character === 'P' ||
    character === 'S' ||
    character === 'T';
}

function isAlpha (character) {
  const code = toCharacterCode(character);
  return code >= 65 && code <= 90;
}

function isNotPunctuation (string) {
  return !configuration.language.punctuationRegExp.test(string);
}

function isNotStopword (word) {
  return !configuration.language.stopwordsRegExp.test(word);
}

function isPunctuation (string) {
  return configuration.language.punctuationRegExp.test(string);
}

function isSoft (character) {
  character = toCharacter(character);
  return character === 'E' || character === 'I' || character === 'Y';
}

function isStopword (word) {
  return configuration.language.stopwordsRegExp.test(word);
}

function isVowel (character) {
  character = toCharacter(character);

  return character === 'A' ||
        character === 'E' ||
        character === 'I' ||
        character === 'O' ||
        character === 'U';
}

function metaphone (value) {
  value = String(value || '');

  if (!value) {
    return '';
  }

  //////////

  const sh = 'X';
  const th = '0';

  //////////

  let phonized = '';
  let index = 0;
  let skip;

  const context = {
    phonize: (characters) => {
      phonized += characters;
    },
    at: (offset) => {
      return value.charAt(index + offset).toUpperCase();
    },
    prev: () => {
      return value.charAt(index - 1).toUpperCase();
    },
    current: () => {
      return value.charAt(index).toUpperCase();
    },
    next: () => {
      return value.charAt(index + 1).toUpperCase();
    }
  };

  while (!isAlpha(context.current())) {
    if (!context.current()) {
      return '';
    }

    index++;
  }

  switch (context.current()) {
    case 'A':
      if (context.next() === 'E') {
        context.phonize('E');
        index += 2;
      } else {
        context.phonize('A');
        index++;
      }
      break;
    case 'G':
    case 'K':
    case 'P':
      if (context.next() === 'N') {
        context.phonize('N');
        index += 2;
      }
      break;
    case 'W':
      if (context.next() === 'R') {
        context.phonize(context.next());
        index += 2;
      } else if (context.next() === 'H') {
        context.phonize(context.current());
        index += 2;
      } else if (isVowel(context.next())) {
        context.phonize('W');
        index += 2;
      }
      break;
    case 'X':
      context.phonize('S');
      index++;
      break;
    case 'E':
    case 'I':
    case 'O':
    case 'U':
      context.phonize(context.current());
      index++;
      break;
    default:
      break;
  }

  while (context.current()) {
    skip = 1;

    if (!isAlpha(context.current()) || context.current() === context.prev() && context.current() !== 'C') {
      index += skip;
      continue;
    }

    switch (context.current()) {
      case 'B':
        if (context.prev() !== 'M') {
          context.phonize('B');
        }
        break;
      case 'C':
        if (isSoft(context.next())) {
          if (context.next() === 'I' && context.at(2) === 'A') {
            context.phonize(sh);
          } else if (context.prev() !== 'S') {
            context.phonize('S');
          }
        } else if (context.next() === 'H') {
          context.phonize(sh);
          skip++;
        } else {
          context.phonize('K');
        }
        break;
      case 'D':
        if (context.next() === 'G' && isSoft(context.at(2))) {
          context.phonize('J');
          skip++;
        } else {
          context.phonize('T');
        }
        break;
      case 'G':
        if (context.next() === 'H') {
          if (!(noGhToF(context.at(-3)) || context.at(-4) === 'H')) {
            context.phonize('F');
            skip++;
          }
        } else if (context.next() === 'N') {
          if (!(!isAlpha(context.at(2)) || context.at(2) === 'E' && context.at(3) === 'D')) {
            context.phonize('K');
          }
        } else if (isSoft(context.next()) && context.prev() !== 'G') {
          context.phonize('J');
        } else {
          context.phonize('K');
        }
        break;
      case 'H':
        if (isVowel(context.next()) && !dipthongH(context.prev())) {
          context.phonize('H');
        }
        break;
      case 'K':
        if (context.prev() !== 'C') {
          context.phonize('K');
        }
        break;
      case 'P':
        if (context.next() === 'H') {
          context.phonize('F');
        } else {
          context.phonize('P');
        }
        break;
      case 'Q':
        context.phonize('K');
        break;
      case 'S':
        if (context.next() === 'I' && (context.at(2) === 'O' || context.at(2) === 'A')) {
          context.phonize(sh);
        } else if (context.next() === 'H') {
          context.phonize(sh);
          skip++;
        } else {
          context.phonize('S');
        }
        break;
      case 'T':
        if (context.next() === 'I' && (context.at(2) === 'O' || context.at(2) === 'A')) {
          context.phonize(sh);
        } else if (context.next() === 'H') {
          context.phonize(th);
          skip++;
        } else if (!(context.next() === 'C' && context.at(2) === 'H')) {
          context.phonize('T');
        }
        break;
      case 'V':
        context.phonize('F');
        break;
      case 'W':
        if (isVowel(context.next())) {
          context.phonize('W');
        }
        break;
      case 'X':
        context.phonize('KS');
        break;
      case 'Y':
        if (isVowel(context.next())) {
          context.phonize('Y');
        }
        break;
      case 'Z':
        context.phonize('S');
        break;
      case 'F':
      case 'J':
      case 'L':
      case 'M':
      case 'N':
      case 'R':
        context.phonize(context.current());
        break;
      default:
        break;
    }

    index += skip;
  }

  return phonized;
}

function noGhToF (character) {
  character = toCharacter(character);

  return character === 'B' || character === 'D' || character === 'H';
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
  stripPunctuation = configuration.stripPunctuation,
  stripStopwords = configuration.stripStopwords
} = {}) {
  let tokens = string.toString().
    match(tokenizer);

  if (stripPunctuation) {
    tokens = tokens.filter(token => { return isNotPunctuation(token); });
  }

  if (stripStopwords) {
    tokens = tokens.filter(token => { return isNotStopword(token); });
  }

  return tokens;
}

function toCharacterCode (character) {
  return toCharacter(character).charCodeAt(0);
}

function toCharacter (character) {
  return String(character).
    charAt(0).
    toUpperCase();
}

//////////

module.exports = {
  configure,
  isAlpha,
  isNotPunctuation,
  isNotStopword,
  isPunctuation,
  isSoft,
  isStopword,
  isVowel,
  metaphone,
  stringEditDistance,
  tokenize
};
