'use strict';

require('../pp');
const nlp = require('../nlp');

describe('Natural Lanuage Processing Tools Test', () => {
  it('should test string to metaphone transformations', () => {
    expect(nlp.metaphone('Filipowitz')).toBe('FLPWTS');
    expect(nlp.metaphone('Xavier')).toBe('SFR');
    expect(nlp.metaphone('acceptingness')).toBe('AKSPTNKNS');
    expect(nlp.metaphone('allegrettos')).toBe('ALKRTS');
    expect(nlp.metaphone('considerations')).toBe('KNSTRXNS');
    expect(nlp.metaphone('crevalle')).toBe('KRFL');
    expect(nlp.metaphone('delicious')).toBe('TLSS');
    expect(nlp.metaphone('detestable')).toBe('TTSTBL');
    expect(nlp.metaphone('michael')).toBe('MXL');
  });

  it('should test string edit distance', () => {
    expect(nlp.stringEditDistance('foo', 'bar')).toBe(3);
  });

  it('should test simple tokenization', () => {
    const tokens = nlp.tokenize('This is a test.');
    expect(tokens).toStrictEqual([ 'This', 'is', 'a', 'test', '.' ]);
  });

  it('should test simple tokenization with stopword removal', () => {
    const tokens = nlp.tokenize('This is a test.', {
      stripPunctuation: true,
      stripStopwords: true
    });
    expect(tokens).toStrictEqual([ 'test' ]);
  });
});
