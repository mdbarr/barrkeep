'use strict';

const crypto = require('crypto');
const {
  decrypt, encrypt, sha1, sha256,
} = require('../crypto');

describe('Crypto Test', () => {
  it('should test sha1 hashing', () => {
    expect(sha1('foo')).toBe('0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33');
  });

  it('should test sha256 hashing', () => {
    expect(sha256('foo')).
      toBe('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae');
  });

  it('should test encrypt and decrypt', () => {
    const key = crypto.randomBytes(16).toString('hex');
    const encrypted = encrypt('super-secret', key);
    expect(decrypt(encrypted, key)).toBe('super-secret');
  });
});
