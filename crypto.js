'use strict';

const crypto = require('node:crypto');

function decrypt (text, secret, algorithm = 'aes-256-cbc') {
  const key = secret.replace(/-/gu, '').substring(0, 32);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([ decrypted, decipher.final() ]).toString();

  return decrypted;
}

function encrypt (text, secret, algorithm = 'aes-256-cbc', ivLength = 16) {
  const key = secret.replace(/-/gu, '').substring(0, 32);
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([ encrypted, cipher.final() ]);
  encrypted = `${ iv.toString('hex') }:${ encrypted.toString('hex') }`;

  return encrypted;
}

function hash (input, algorithm, encoding) {
  return crypto.createHash(algorithm).
    update(typeof input === 'string' ? input : JSON.stringify(input)).
    digest(encoding);
}

function sha1 (input) {
  return hash(input, 'sha1', 'hex');
}

function sha256 (input) {
  return hash(input, 'sha256', 'hex');
}

module.exports = {
  decrypt,
  encrypt,
  hash,
  sha1,
  sha256,
};
