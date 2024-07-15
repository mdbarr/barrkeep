'use strict';

const Enum = require('../classes/Enum');

describe('Enum Test', () => {
  let Foo;

  it('should create a new enum', () => {
    Foo = new Enum('a', 'b', 'c');
    expect(Foo.A).toBe(0);
    expect(Foo.a).toBe(0);
    expect(Foo.B).toBe(1);
    expect(Foo.c).toBe(2);
    // eslint-disable-next-line no-undefined
    expect(Foo.D).toBe(undefined);
  });

  it('should create an enum variable', () => {
    const foo = Enum.A;
    expect(foo).toBe(Enum.A);
  });
});
