'use strict';

const {
  duration, formatNumber, timestamp
} = require('./utils');

const spinners = require('./spinners.json');

class ProgressBar {
  constructor ({
    total = 10, value = 0, format = '[$progress]', stream = process.stderr,
    y, x = 0, width, complete = '=', incomplete = ' ', head = '>', clear,
    interval, environment = {}, spinner = 'dots', durationOptions
  } = {}) {
    this._total = total;
    this._value = value;

    this.width = width || Math.max(this._total, 60);

    this.stream = stream;
    this.format = format;
    this.characters = {
      complete,
      incomplete,
      head
    };

    this.clear = clear === undefined ? false : clear;
    this.y = y || undefined;
    this.x = x;

    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner].frames;
    this.interval = interval || spinners[spinner].interval;

    this.durationOptions = durationOptions;

    this.environment = environment;
    this.initialEnvironment = Object.assign({}, environment);

    this.complete = false;
    this.lastUpdate = false;

    this.ticks = 0;
    this.start = timestamp();
    this.tick = this.start;
    this.eta = 0;

    if (this._total === 0) {
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

  get value () {
    return this._value;
  }

  set value (value) {
    if (this.complete) {
      return;
    }

    this._value = value;

    this.tick = timestamp();
    const elapsed = this.tick - this.start;
    this.eta = elapsed / this._value * (this._total - this._value);

    this.render();

    if (this._value >= this._total) {
      this.complete = true;
      this.done();
    }
  }

  get total () {
    return this._total;
  }

  set total (value) {
    this._total = value;
    this.render();
  }

  render () {
    if (!this.stream.isTTY) {
      return;
    }

    let ratio = this._value / this._total;
    ratio = Math.min(Math.max(ratio, 0), 1);

    const percent = Math.floor(ratio * 100);

    const now = timestamp();
    const elapsed = now - this.start;
    const eta = this._value === 0 ? 0 : this.eta - (now - this.tick);
    const rate = this._value / (elapsed / 1000);

    const spinner = this.spinner[this.ticks];

    let string = this.format.
      replace(/\$_value/g, formatNumber(this._value)).
      replace(/\$_total/g, formatNumber(this._total)).
      replace(/\$remaining/g, formatNumber(this._total - this._value)).
      replace(/\$elapsed/g, duration(elapsed, this.durationOptions)).
      replace(/\$eta/g, isNaN(eta) || !isFinite(eta) || !eta ? 'unknown' : duration(eta, this.durationOptions)).
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
    if (this._value < this._total && completeLength > 0) {
      headLength = 1;
      completeLength--;
    }
    const incompleteLength = Math.max(0, width - (completeLength + headLength));

    const head = headLength ? this.characters.head : '';
    const complete = this.characters.complete.repeat(completeLength);
    const incomplete = this.characters.incomplete.repeat(incompleteLength);

    string = string.replace('$progress', complete + head + incomplete).
      replace(/\$progress/g, '');

    if (this.lastUpdate !== string) {
      this.stream.cursorTo(this.x, this.y);
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
        this.stream.cursorTo(this.x, this.y);
      }
    } else {
      this.stream.write('\n');
    }
  }

  reset () {
    this._value = 0;
    this.complete = 0;
    this.start = timestamp();
    Object.assign(this.environment, this.initialEnvironment);
  }
}

class Spinner {
  constructor ({
    spinner = 'dots', stream = process.stderr, x, y, interval, clear,
    prepend = '', append = ''
  } = {}) {
    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner];
    this.interval = interval || this.spinner.interval;
    this.frames = this.spinner.frames;

    this.stream = stream;
    this.x = x;
    this.y = y;

    this.prepend = prepend;
    this.append = append;

    this.clear = clear === undefined;

    this.frame = 0;
  }

  start () {
    if (this.update) {
      clearInterval(this.update);
    }

    this.stream.write('\x1b[?25l');

    if (this.x !== undefined) {
      this.stream.cursorTo(this.x, this.y);
    }

    this.stream.write(`${ this.prepend } ${ this.append }`);

    this.stream.moveCursor(this.append.length * -1);

    this.update = setInterval(() => {
      const character = this.frames[this.frame];

      this.position();

      this.stream.write(`${ character }`);

      this.frame++;
      if (this.frame >= this.frames.length) {
        this.frame = 0;
      }
    }, this.interval);
  }

  position () {
    if (this.x !== undefined) {
      this.stream.cursorTo(this.x + this.prepend.length, this.y);
    } else {
      this.stream.moveCursor(-1);
    }
  }

  stop () {
    clearInterval(this.update);

    if (this.clear) {
      this.position();
      this.stream.write(' ');
    }

    this.stream.write('\x1b[?25h');
    this.stream.moveCursor(this.append.length);
  }
}

module.exports = {
  ProgressBar,
  Spinner
};
