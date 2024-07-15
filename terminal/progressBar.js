'use strict';

const process = require('node:process');

const styler = require('./style');
const {
  duration, formatNumber, stripAnsi, timestamp,
} = require('../utils');

const spinners = require('../data/spinners.json');

class ProgressBar {
  #total;
  #value;

  constructor ({
    total = 10, value = 0, format = '[$progress]', stream = process.stderr,
    y, x = 0, width, complete = '=', incomplete = ' ', head = '>', clear,
    interval, tokens = {}, spinner = 'dots', spinnerStyle, cursor = true,
    durationOptions, formatOptions, onTick,
  } = {}) {
    this.#total = total;
    this.#value = value;

    this.width = width || Math.max(this.#total, 60);

    this.stream = stream;
    this.cursor = cursor;
    this.format = format;
    this.characters = {
      complete,
      head,
      incomplete,
    };

    this.clear = typeof clear === 'undefined' ? false : clear;
    // eslint-disable-next-line no-undefined
    this.y = y || undefined;
    this.x = x;

    this.spinner = spinners[spinner] ? spinners[spinner] : spinners.dots;
    this.frames = this.spinner.frames;
    this.interval = interval || this.spinner.interval;
    this.spinnerStyle = spinnerStyle;

    this.durationOptions = durationOptions;
    this.formatOptions = formatOptions;

    this.tokens = tokens;
    this.initialTokens = { ...tokens };

    this.complete = false;
    this.lastUpdate = false;

    this.ticks = 0;
    this.start = timestamp();
    this.tick = this.start;
    this.eta = 0;

    this.onTicks = onTick ? [ onTick ] : [ ];
    Object.defineProperty(this, 'onTick', {
      configurable: true,
      enumerable: true,
      get () { return this.onTicks; },
      set (tick) { this.onTicks.push(tick); },
    });

    if (this.#total === 0) {
      this.complete = true;
    } else {
      this.render();
      this.ticker = setInterval(() => {
        if (!this.complete) {
          this.ticks++;
          if (this.ticks >= this.frames.length) {
            this.ticks = 0;
          }

          for (const tick of this.onTicks) {
            if (typeof tick === 'function') {
              tick();
            }
          }

          this.render();
        }
      }, this.interval);
    }
  }

  get value () {
    return this.#value;
  }

  set value (value) {
    if (this.complete) {
      return;
    }

    this.#value = value;

    this.tick = timestamp();
    const elapsed = this.tick - this.start;
    this.eta = elapsed / this.#value * (this.#total - this.#value);

    this.render();

    if (this.#value >= this.#total) {
      this.eta = 0;
      this.done();
    }
  }

  get total () {
    return this.#total;
  }

  set total (value) {
    this.#total = value;
    this.render();
  }

  render () {
    if (!this.stream.isTTY) {
      return;
    }

    let ratio = this.#value / this.#total;
    ratio = Math.min(Math.max(ratio, 0), 1);

    const percent = Math.floor(ratio * 100);

    const now = timestamp();
    const elapsed = now - this.start;
    const eta = this.#value === 0 ? 0 : this.eta;
    const rate = this.#value / (elapsed / 1000);

    const spinner = this.spinnerStyle ? styler(this.frames[this.ticks], this.spinnerStyle) :
      this.frames[this.ticks];

    let string = this.format.
      replace(/\$value/gu, formatNumber(this.#value, this.formatOptions)).
      replace(/\$total/gu, formatNumber(this.#total, this.formatOptions)).
      replace(/\$remaining/gu, formatNumber(this.#total - this.#value, this.formatOptions)).
      replace(/\$elapsed/gu, duration(elapsed, this.durationOptions)).
      replace(/\$eta/gu, isNaN(eta) || !isFinite(eta) || !eta ? 'unknown' : duration(eta, this.durationOptions)).
      replace(/\$percent/gu, `${ percent.toFixed(0) }%`).
      replace(/\$rate/gu, Math.round(rate)).
      replace(/\$spinner/gu, spinner).
      replace(/\$(.+?)\b/gu, (match, token) => {
        if (typeof this.tokens[token] !== 'undefined') {
          let value = this.tokens[token];

          if (typeof value === 'number') {
            value = formatNumber(value, this.formatOptions);
          }

          return value;
        }

        if (token === 'progress') {
          return '$progress';
        }

        return '';
      });

    const { length } = stripAnsi(string.replace(/\$progress/gu, ''));
    const columns = Math.max(0, this.stream.columns - length);
    const width = Math.min(this.width, columns);

    let completeLength = Math.max(0, Math.round(width * ratio));
    let headLength = 0;
    if (this.#value < this.#total && completeLength > 0 && this.characters.head) {
      headLength = 1;
      completeLength--;
    }
    const incompleteLength = Math.max(0, width - (completeLength + headLength));

    const head = headLength ? this.characters.head : '';
    const complete = this.characters.complete.repeat(completeLength);
    const incomplete = this.characters.incomplete.repeat(incompleteLength);

    string = string.replace('$progress', complete + head + incomplete).
      replace(/\$progress/gu, '');

    if (this.lastUpdate !== string) {
      this.stream.cursorTo(this.x, this.y);
      if (this.cursor) {
        this.stream.write('\x1b[?25l');
      }
      this.stream.write(string);
      this.stream.clearLine(1);
      this.lastUpdate = string;
    }
  }

  done (text = '') {
    if (this.complete) {
      return;
    }

    this.complete = true;

    clearInterval(this.ticker);

    if (this.stream.isTTY) {
      if (this.clear || text) {
        if (this.stream.clearLine) {
          this.stream.cursorTo(this.x, this.y);
          this.stream.clearLine(1);
        }
      }
      if (text) {
        this.stream.write(text);
      }
      if (this.cursor) {
        this.stream.write('\x1b[?25h');
      }
    } else if (text) {
      console.log(text);
    }
  }

  reset () {
    this.#value = 0;
    this.complete = false;
    this.start = timestamp();
    Object.assign(this.tokens, this.initialTokens);
  }
}

module.exports = ProgressBar;
