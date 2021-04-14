'use strict';

const styler = require('./style');
const {
  duration, formatNumber, stripAnsi, timestamp,
} = require('./utils');

const { cursorPosition, sequences } = require('./term');

const spinners = require('./data/spinners.json');

class ProgressBar {
  constructor ({
    total = 10, value = 0, format = '[$progress]', stream = process.stderr,
    y, x = 0, width, complete = '=', incomplete = ' ', head = '>', clear,
    interval, tokens = {}, spinner = 'dots', spinnerStyle,
    durationOptions, formatOptions, onTick,
  } = {}) {
    this._total = total;
    this._value = value;

    this.width = width || Math.max(this._total, 60);

    this.stream = stream;
    this.format = format;
    this.characters = {
      complete,
      incomplete,
      head,
    };

    this.clear = clear === undefined ? false : clear;
    this.y = y || undefined;
    this.x = x;

    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner].frames;
    this.interval = interval || spinners[spinner].interval;
    this.spinnerStyle = spinnerStyle;

    this.durationOptions = durationOptions;
    this.formatOptions = formatOptions;

    this.tokens = tokens;
    this.initialTokens = Object.assign({}, tokens);

    this.complete = false;
    this.lastUpdate = false;

    this.ticks = 0;
    this.start = timestamp();
    this.tick = this.start;
    this.eta = 0;

    this.onTicks = onTick ? [ onTick ] : [ ];
    Object.defineProperty(this, 'onTick', {
      get () { return this.onTicks; },
      set (tick) { this.onTicks.push(tick); },
      enumerable: true,
      configurable: true,
    });

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
      this.eta = 0;
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
    const eta = this._value === 0 ? 0 : this.eta;
    const rate = this._value / (elapsed / 1000);

    const spinner = this.spinnerStyle ? styler(this.spinner[this.ticks], this.spinnerStyle) :
      this.spinner[this.ticks];

    let string = this.format.
      replace(/\$value/g, formatNumber(this._value, this.formatOptions)).
      replace(/\$total/g, formatNumber(this._total, this.formatOptions)).
      replace(/\$remaining/g, formatNumber(this._total - this._value, this.formatOptions)).
      replace(/\$elapsed/g, duration(elapsed, this.durationOptions)).
      replace(/\$eta/g, isNaN(eta) || !isFinite(eta) || !eta ? 'unknown' : duration(eta, this.durationOptions)).
      replace(/\$percent/g, `${ percent.toFixed(0) }%`).
      replace(/\$rate/g, Math.round(rate)).
      replace(/\$spinner/g, spinner).
      replace(/\$(.+?)\b/g, (match, token) => {
        if (this.tokens[token] !== undefined) {
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

    const length = stripAnsi(string.replace(/\$progress/g, '')).length;
    const columns = Math.max(0, this.stream.columns - length);
    const width = Math.min(this.width, columns);

    let completeLength = Math.max(0, Math.round(width * ratio));
    let headLength = 0;
    if (this._value < this._total && completeLength > 0 && this.characters.head) {
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
      this.stream.write(`${ text }\x1b[?25h`);
    } else if (text) {
      console.log(text);
    }
  }

  reset () {
    this._value = 0;
    this.complete = false;
    this.start = timestamp();
    Object.assign(this.tokens, this.initialTokens);
  }
}

class Spinner {
  constructor ({
    spinner = 'dots', stream = process.stderr, x, y, interval, clear,
    style, prepend = '', append = '', onTick,
  } = {}) {
    spinner = spinners[spinner] ? spinner : 'dots';

    this.spinner = spinners[spinner];
    this.interval = interval || this.spinner.interval;
    this.frames = this.spinner.frames;

    this.stream = stream;
    this.x = x;
    this.y = y;

    if (this.y !== undefined && this.x === undefined) {
      this.x = 0;
    }

    this.style = style;

    this._prepend = prepend;
    this._append = append;

    Object.defineProperty(this, 'prepend', {
      get () { return this._prepend; },
      set (string) { this._prepend = string; this.needsRedraw = 1; },
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(this, 'append', {
      get () { return this._append; },
      set (string) { this._append = string; this.needsRedraw = 1; },
      enumerable: true,
      configurable: true,
    });

    this.offset = stripAnsi(this.prepend).length;

    this.clear = clear === undefined;

    this.frame = 0;

    this.running = false;

    this.onTicks = onTick ? [ onTick ] : [ ];
    Object.defineProperty(this, 'onTick', {
      get () { return this.onTicks; },
      set (tick) { this.onTicks.push(tick); },
      enumerable: true,
      configurable: true,
    });
  }

  start () {
    if (this.running) {
      return;
    }

    this.running = true;

    if (this.update) {
      clearInterval(this.update);
    }

    this.needsRedraw = 1;

    this.redraw = () => {
      if (!this.stream.isTTY) {
        return;
      }

      this.stream.write('\x1b[?25l');

      if (this.x !== undefined) {
        this.stream.cursorTo(this.x, this.y);
      }
      this.stream.write(`${ this.prepend } ${ this.append }`);
      this.stream.moveCursor(this.append.length * -1);

      this.needsRedraw = 0;
    };

    this.update = setInterval(() => {
      for (const tick of this.onTicks) {
        if (typeof tick === 'function') {
          tick();
        }
      }

      if (this.needsRedraw) {
        this.redraw();
      }

      if (this.stream.isTTY) {
        const character = this.style ? styler(this.frames[this.frame], this.style) :
          this.frames[this.frame];

        this.position();

        this.stream.write(`\x1b[?25l${ character }`);

        this.frame++;
        if (this.frame >= this.frames.length) {
          this.frame = 0;
        }
      }
    }, this.interval);
  }

  position () {
    if (this.stream.isTTY) {
      if (this.x !== undefined) {
        this.stream.cursorTo(this.x + this.offset, this.y);
      } else {
        this.stream.moveCursor(-1);
      }
    }
  }

  stop (text = '') {
    if (!this.running) {
      return;
    }

    this.running = false;

    clearInterval(this.update);

    if (this.stream.isTTY) {
      if (this.clear || text) {
        if (this.x !== undefined) {
          this.stream.cursorTo(this.x, this.y);
        } else {
          this.position();
          this.stream.moveCursor(this.offset * -1);
        }
        this.stream.clearLine(1);
      }

      this.stream.write(`${ text }\x1b[?25h`);
    } else if (text) {
      console.log(text);
    }
  }
}

class Stack {
  constructor ({
    rows = 1, stream = process.stderr, clear,
  } = {}) {
    this.rows = rows;
    this.stream = stream;
    this.clear = Boolean(clear);

    this.slots = [];

    this.y = 1;

    this.slot = (i) => this.slots[i];
  }

  async start () {
    if (this.stream.isTTY) {
      this.stream.write(sequences.hideCursor());
      this.stream.write('\n'.repeat(this.rows - 1));
      const position = await cursorPosition();

      this.y = position.y - this.rows;
    } else {
      this.y = this.rows;
    }

    for (let i = 0; i < this.rows; i++) {
      const slot = {};
      const y = this.y + i;

      slot.progress = (options) => {
        slot.progress = new ProgressBar(Object.assign(options, {
          stream: this.stream,
          y,
        }));
        return slot.progress;
      };

      slot.spinner = (options) => {
        slot.spinner = new Spinner(Object.assign(options, {
          stream: this.stream,
          y,
        }));
        slot.spinner.start();
        return slot.spinner;
      };

      this.slots[i] = slot;
    }
  }

  stop () {
    for (let i = 0; i < this.rows; i++) {
      if (typeof this.slots[i].progress.done === 'function') {
        this.slots[i].progress.done();
      }
      if (typeof this.slots[i].spinner.stop === 'function') {
        this.slots[i].spinner.stop();
      }
    }

    if (this.stream.isTTY) {
      this.stream.write('\n');
      this.stream.write(sequences.showCursor());

      if (this.clear) {
        this.stream.cursorTo(0, this.y - 1);
        this.stream.clearScreenDown();
      } else {
        this.stream.cursorTo(0, this.y + this.rows);
      }
    }
  }
}

module.exports = {
  ProgressBar,
  Spinner,
  Stack,
};
