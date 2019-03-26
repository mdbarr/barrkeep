'use strict';

Math.$random = function(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function MersenneTwister(seed) {
  seed = seed || Date.now();
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df;
  this.UPPER_MASK = 0x80000000;
  this.LOWER_MASK = 0x7fffffff;
  this.I = Math.pow(2, 32);

  this.mt = new Array(this.N);
  this.mti = this.N + 1;

  this.mt[0] = seed >>> 0;
  for (this.mti = 1; this.mti < this.N; this.mti++) {
    const s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
    this.mt[this.mti] = (((s & 0xffff0000) >>> 16) * 1812433253 << 16) +
                           (s & 0x0000ffff) * 1812433253 + this.mti;
    this.mt[this.mti] >>>= 0;
  }
}

MersenneTwister.prototype.random = function(min, max) {
  if (min !== undefined && max !== undefined) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  } else if (min !== undefined) {
    return this.random(0, min);
  }

  const mag01 = new Array(0x0, this.MATRIX_A);
  let y;

  if (this.mti >= this.N) {
    let kk;

    for (kk = 0; kk < this.N - this.M; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 0x1];
    }

    for (;kk < this.N - 1; kk++) {
      y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
      this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 0x1];
    }

    y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;

    this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 0x1];

    this.mti = 0;
  }

  y = this.mt[this.mti++];

  y ^= y >>> 11;
  y ^= y << 7 & 0x9d2c5680;
  y ^= y << 15 & 0xefc60000;
  y ^= y >>> 18;
  y = y >>> 0;

  return (y + 0.5) / this.I;
};

module.exports = MersenneTwister;
