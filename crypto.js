'use strict';

const crypto = require('node:crypto');

function decrypt (text, secret, algorithm = 'aes-256-cbc') {
  let decrypted = null;
  secret = secret.replace(/-/g, '').substring(0, 32);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, iv);
  decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([ decrypted, decipher.final() ]).toString();

  return decrypted;
}

function encrypt (text, secret, algorithm = 'aes-256-cbc', ivLength = 16) {
  let encrypted = null;
  secret = secret.replace(/-/g, '').substring(0, 32);
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  encrypted = cipher.update(text);
  encrypted = Buffer.concat([ encrypted, cipher.final() ]);
  encrypted = `${ iv.toString('hex') }:${ encrypted.toString('hex') }`;

  return encrypted;
}

function sha1 (input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).
    digest('hex');
}

function sha256 (input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha256').update(input).
    digest('hex');
}

module.exports = {
  decrypt,
  encrypt,
  sha1,
  sha256,
};
