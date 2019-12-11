'use strict';

const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';

const {
  duration, formatNumber, timestamp
} = require('./utils');

const spinners = {
  arrows: '←↖↑↗→↘↓↙',
  blocks: '▖▘▝▗',
  braille: '⠟⠯⠷⠾⠽⠻',
  'braille-large': '⡿⣟⣯⣷⣾⣽⣻⢿',
  circle: '◐◓◑◒',
  vertical: '▁▃▄▅▆▇█▇▆▅▄▃',
  horizontal: '▉▊▋▌▍▎▏▎▍▌▋▊▉',
  pie: '◴◷◶◵',
  pipes: '┤┘┴└├┌┬┐',
  spin: '|/-\\',
  triangles: '◢◣◤◥'
};

class ProgressBar {
  constructor({
    total = 10, format = '[$progress]', stream = process.stderr, width,
    complete = '=', incomplete = ' ', head = '>', clear,
    interval = 250, environment = {}, spinner = 'spin'
  } = {}) {
    this.total = total;
    this.width = width || this.total;

    this.stream = stream;
    this.format = format;
    this.characters = {
      complete,
      incomplete,
      head
    };
    this.spinner = spinners[spinner] || spinners.braille;

    this.clear = clear === undefined ? false : clear;
    this.environment = environment;
    this.initialEnvironment = Object.assign({}, environment);

    this.interval = interval;

    this.value = 0;

    this.complete = false;
    this.lastUpdate = false;

    this.ticks = 0;
    this.start = timestamp();
    this.tick = this.start;
    this.eta = 0;

    this.render();
    this.tick = setInterval(() => {
      this.ticks++;
      if (this.ticks >= this.spinner.length) {
        this.ticks = 0;
      }

      this.render();
    }, this.interval);
  }

  progress (increment = 1) {
    if (this.complete) {
      return;
    }

    this.value += increment;

    this.tick = timestamp();
    const elapsed = this.tick - this.start;
    this.eta = elapsed / this.value * (this.total - this.value);

    this.render();

    if (this.value >= this.total) {
      this.complete = true;
      this.done();
    }
  }

  render () {
    if (!this.stream.isTTY) {
      return;
    }

    let ratio = this.value / this.total;
    ratio = Math.min(Math.max(ratio, 0), 1);

    const percent = Math.floor(ratio * 100);

    const now = timestamp();
    const elapsed = now - this.start;
    const eta = this.value === 0 ? 0 : this.eta - (now - this.tick);
    const rate = this.value / (elapsed / 1000);

    const spinner = this.spinner[this.ticks];

    let string = this.format.
      replace(/\$value/g, formatNumber(this.value)).
      replace(/\$total/g, formatNumber(this.total)).
      replace(/\$remaining/g, formatNumber(this.total - this.value)).
      replace(/\$elapsed/g, duration(elapsed)).
      replace(/\$eta/g, isNaN(eta) || !isFinite(eta) || !eta ? 'unknown' : duration(eta)).
      replace(/\$percent/g, `${ percent.toFixed(0) }%`).
      replace(/\$rate/g, Math.round(rate)).
      replace(/\$spinner/g, spinner).
      replace(/\$(.+?)\b/g, (match, token) => {
        if (this.environment[token]) {
          return this.environment[token];
        }
        if (token === 'progress') {
          return '$progress';
        }
        return '';
      });

    const columns = Math.max(0, this.stream.columns - string.replace(/\$progress/g, '').length);
    const width = Math.min(this.width, columns);
    const completeLength = Math.round(width * ratio);

    const complete = this.characters.complete.repeat(Math.max(0, completeLength)).
      replace(/.$/, this.value >= this.total ? this.characters.complete : this.characters.head);
    const incomplete = this.characters.incomplete.repeat(Math.max(0, width - completeLength));

    string = string.replace('$progress', complete + incomplete).
      replace(/\$progress/g, '');

    if (this.lastUpdate !== string) {
      this.stream.cursorTo(0);
      this.stream.write(`${ HIDE_CURSOR }${ string }`);
      this.stream.clearLine(1);
      this.lastUpdate = string;
    }
  }

  done () {
    clearInterval(this.tick);

    this.stream.write(SHOW_CURSOR);

    if (this.clear) {
      if (this.stream.clearLine) {
        this.stream.clearLine();
        this.stream.cursorTo(0);
      }
    } else {
      this.stream.write('\n');
    }
  }

  reset () {
    this.value = 0;
    this.complete = 0;
    this.start = timestamp();
    Object.assign(this.environment, this.initialEnvironment);
  }
}

module.exports = ProgressBar;
