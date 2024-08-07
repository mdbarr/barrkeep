'use strict';

const query = require('../query');

const object = {
  a: 10,
  b: 'fooo',
  c: [ 1, 2, 3 ],
  d: { e: 20 },
  f: [ 5, 10, 15 ],
  g: 'bar',
};

describe('Query Test', () => {
  it('should verify a compound query', () => {
    const result = query(object, {
      a: {
        $gt: 5,
        $lt: 25,
        $mod: 2,
      },
      b: 'fooo',
      c: {
        $elemMatch: { $eq: 2 },
        $size: 3,
      },
      d: { $where: () => true },
      'd.e': 20,
      f: {
        $all: {
          $gte: 5,
          $type: 'number',
        },
      },
      g: { $regexp: /ba.*/u },
    });

    expect(result).toBe(true);
  });
});
