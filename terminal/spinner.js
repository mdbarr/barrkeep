'use strict';

const styler = require('./style');
const { stripAnsi } = require('../utils');
const spinners = require('../data/spinners.json');

class Spinner {
  #append;
  #prepend;

  constructor ({
    spinner = 'dots', stream = process.stderr, x, y, interval, clear,
    style, prepend = '', append = '', onTick, cursor = true,
  } = {}) {
    this.spinner = spinners[spinner] ? spinners[spinner] : spinners.dots;
    this.interval = interval || this.spinner.interval;
    this.frames = this.spinner.frames;

    this.stream = stream;
    this.cursor = cursor;
    this.x = x;
    this.y = y;

    if (typeof this.y !== 'undefined' && typeof this.x === 'undefined') {
      this.x = 0;
    }

    this.style = style;

    this.#prepend = prepend;
    this.#append = append;

    Object.defineProperty(this, 'prepend', {
      configurable: true,
      enumerable: true,
      get () { return this.#prepend; },
      set (string) { this.#prepend = string; this.needsRedraw = 1; },
    });

    Object.defineProperty(this, 'append', {
      configurable: true,
      enumerable: true,
      get () { return this.#append; },
      set (string) { this.#append = string; this.needsRedraw = 1; },
    });

    this.offset = stripAnsi(this.prepend).length;

    this.clear = typeof clear === 'undefined';

    this.frame = 0;

    this.running = false;

    this.onTicks = onTick ? [ onTick ] : [ ];
    Object.defineProperty(this, 'onTick', {
      configurable: true,
      enumerable: true,
      get () { return this.onTicks; },
      set (tick) { this.onTicks.push(tick); },
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

      if (this.cursor) {
        this.stream.write('\x1b[?25l');
      }

      if (typeof this.x !== 'undefined') {
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

        if (this.cursor) {
          this.stream.write('\x1b[?25l');
        }
        this.stream.write(character);

        this.frame++;
        if (this.frame >= this.frames.length) {
          this.frame = 0;
        }
      }
    }, this.interval);
  }

  position () {
    if (this.stream.isTTY) {
      if (typeof this.x === 'undefined') {
        this.stream.moveCursor(-1);
      } else {
        this.stream.cursorTo(this.x + this.offset, this.y);
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
        if (typeof this.x === 'undefined') {
          this.position();
          this.stream.moveCursor(this.offset * -1);
        } else {
          this.stream.cursorTo(this.x, this.y);
        }
        this.stream.clearLine(1);
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
}

module.exports = Spinner;
