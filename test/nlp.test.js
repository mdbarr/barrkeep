'use strict';

require('../pp');
const nlp = require('../nlp');

describe('Natural Lanuage Processing Tools Test', () => {
  it('should test simple tokenization', () => {
    const tokens = nlp.tokenize('This is a test.');
    expect(tokens).toStrictEqual([ 'This', 'is', 'a', 'test', '.' ]);
  });

  it('should test simple tokenization with stopword removal', () => {
    const tokens = nlp.tokenize('This is a test.', { stripStopwords: true });
    expect(tokens).toStrictEqual([ 'test', '.' ]);
  });


  it('should test string edit distance', () => {
    expect(nlp.stringEditDistance('foo', 'bar')).toBe(3);
  });
});
