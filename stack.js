'use strict';

const ProgressBar = require('./progressBar');
const Spinner = require('./spinner');

const { cursorPosition, sequences } = require('./term');

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
          cursor: false,
          stream: this.stream,
          y,
        }));
        return slot.progress;
      };

      slot.spinner = (options) => {
        slot.spinner = new Spinner(Object.assign(options, {
          cursor: false,
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
      this.stream.write(sequences.showCursor());

      if (this.clear) {
        this.stream.cursorTo(0, this.y - 1);
        this.stream.clearScreenDown();
      } else {
        this.stream.cursorTo(0, this.y + this.rows);
        if (this.y + this.rows >= this.stream.rows) {
          this.stream.write('\n');
        }
      }
    }
  }
}

module.exports = Stack;
