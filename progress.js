'use strict';

const {
  duration, formatNumber, timestamp
} = require('./utils');

const spinners = require('./spinners.json');

class ProgressBar {
  constructor({
    total = 10, format = '[$progress]', stream = process.stderr, width,
    complete = '=', incomplete = ' ', head = '>', clear, y,
    interval, environment = {}, spinner = 'dots'
  } = {}) {
    this.total = total;
    this.width = width || Math.max(this.total, 60);

    this.stream = stream;
    this.format = format;
    this.characters = {
      complete,
      incomplete,
      head
    };

    this.clear = clear === undefined ? false : clear;
    this.y = y || undefined;

    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner].frames;
    this.interval = interval || spinners[spinner].interval;

    this.environment = environment;
    this.initialEnvironment = Object.assign({}, environment);

    this.value = 0;

    this.complete = false;
    this.lastUpdate = false;

    this.ticks = 0;
    this.start = timestamp();
    this.tick = this.start;
    this.eta = 0;

    if (this.total === 0) {
      this.complete = true;
    } else {
      this.render();
      this.ticker = setInterval(() => {
        if (!this.complete) {
          this.ticks++;
          if (this.ticks >= this.spinner.length) {
            this.ticks = 0;
          }

          this.render();
        }
      }, this.interval);
    }
  }

  progress (increment = 1) {
    if (this.complete) {
      return;
    }

    if (increment > 0) {
      this.value += increment;
    } else if (increment < 0) {
      this.total += increment;
    }

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

    let completeLength = Math.max(0, Math.round(width * ratio));
    let headLength = 0;
    if (completeLength < this.total && completeLength > 0) {
      completeLength--;
      headLength = 1;
    }
    const incompleteLength = Math.max(0, width - (completeLength + headLength));

    const head = this.characters.head.repeat(headLength);
    const complete = this.characters.complete.repeat(completeLength);
    const incomplete = this.characters.incomplete.repeat(incompleteLength);

    string = string.replace('$progress', complete + head + incomplete).
      replace(/\$progress/g, '');

    if (this.lastUpdate !== string) {
      this.stream.cursorTo(0, this.y);
      this.stream.write(`\x1b[?25l${ string }`);
      this.stream.clearLine(1);
      this.lastUpdate = string;
    }
  }

  done () {
    clearInterval(this.ticker);

    this.stream.write('\x1b[?25h');

    if (this.clear) {
      if (this.stream.clearLine) {
        this.stream.clearLine();
        this.stream.cursorTo(0, this.y);
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

class Spinner {
  constructor ({
    spinner = 'dots', stream = process.stderr, x, y, interval, clear
  } = {}) {
    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner];
    this.interval = interval || this.spinner.interval;
    this.frames = this.spinner.frames;

    this.stream = stream;
    this.x = x;
    this.y = y;

    this.clear = clear === undefined;

    this.frame = 0;
  }

  start () {
    if (this.update) {
      clearInterval(this.update);
    }

    this.stream.write(' ');

    this.update = setInterval(() => {
      const character = this.frames[this.frame];

      this.position();

      this.stream.write(`\x1b[?25l${ character }`);

      this.frame++;
      if (this.frame >= this.frames.length) {
        this.frame = 0;
      }
    }, this.interval);
  }

  position () {
    if (this.x !== undefined && this.y !== undefined) {
      this.stream.cursorTo(this.x, this.y);
    } else {
      this.stream.moveCursor(-1);
    }
  }

  stop() {
    clearInterval(this.update);

    if (this.clear) {
      this.position();
      this.stream.write(' ');
    }

    this.stream.write('\x1b[?25h');
  }
}

module.exports = {
  ProgressBar,
  Spinner
};
