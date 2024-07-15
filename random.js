'use strict';

//////////
// Mersenne Twister - pseudo random number generator

function MersenneTwister (value) {
  const seed = value || Date.now();
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df;
  this.UPPER_MASK = 0x80000000;
  this.LOWER_MASK = 0x7fffffff;
  this.I = 2 ** 32;

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

MersenneTwister.prototype.random = function (min, max) {
  if (typeof min !== 'undefined' && typeof max !== 'undefined') {
    return Math.floor(this.random() * (max - min + 1)) + min;
  } else if (typeof min !== 'undefined') {
    return this.random(0, min);
  }

  const mag01 = [ 0x0, this.MATRIX_A ];
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
  y >>>= 0;

  return (y + 0.5) / this.I;
};

//////////
// Perlin Noise

function interpolate (x0, x1, alpha) {
  return x0 * (1 - alpha) + alpha * x1;
}

function generateWhiteNoise (width, height, prng) {
  const noise = new Array(width * height);
  for (let i = 0; i < noise.length; ++i) {
    if (prng) {
      noise[i] = prng.random();
    } else {
      noise[i] = Math.random();
    }
  }
  return noise;
}

function generatePerlinNoise (width, height, {
  seed, prng, octaveCount = 4, persistence = 0.2, amplitude = 0.1,
} = {}) {
  const rnd = prng || new MersenneTwister(seed);
  const whiteNoise = generateWhiteNoise(width, height, rnd);

  function generateSmoothNoise (octave) {
    const noise = new Array(width * height);
    const samplePeriod = 2 ** octave;
    const sampleFrequency = 1 / samplePeriod;
    let noiseIndex = 0;
    for (let y = 0; y < height; ++y) {
      const sampleY0 = Math.floor(y / samplePeriod) * samplePeriod;
      const sampleY1 = (sampleY0 + samplePeriod) % height;
      const vertBlend = (y - sampleY0) * sampleFrequency;
      for (let x = 0; x < width; ++x) {
        const sampleX0 = Math.floor(x / samplePeriod) * samplePeriod;
        const sampleX1 = (sampleX0 + samplePeriod) % width;
        const horizBlend = (x - sampleX0) * sampleFrequency;

        const top = interpolate(whiteNoise[sampleY0 * width + sampleX0],
          whiteNoise[sampleY1 * width + sampleX0],
          vertBlend);

        const bottom = interpolate(whiteNoise[sampleY0 * width + sampleX1],
          whiteNoise[sampleY1 * width + sampleX1],
          vertBlend);

        noise[noiseIndex] = interpolate(top, bottom, horizBlend);
        noiseIndex += 1;
      }
    }
    return noise;
  }

  const smoothNoiseList = new Array(octaveCount);
  for (let i = 0; i < octaveCount; ++i) {
    smoothNoiseList[i] = generateSmoothNoise(i);
  }

  const perlinNoise = new Array(width * height);

  let totalAmplitude = 0;
  let currentAmplitude = amplitude;
  for (let i = octaveCount - 1; i >= 0; --i) {
    currentAmplitude *= persistence;
    totalAmplitude += currentAmplitude;

    for (let j = 0; j < perlinNoise.length; ++j) {
      perlinNoise[j] ||= 0;
      perlinNoise[j] += smoothNoiseList[i][j] * currentAmplitude;
    }
  }

  for (let i = 0; i < perlinNoise.length; ++i) {
    perlinNoise[i] /= totalAmplitude;
  }

  return perlinNoise;
}

//////////

module.exports = {
  MersenneTwister,
  generatePerlinNoise,
};
