'use strict';

const SHOW_CURSOR = '\u001b[?25h';
const HIDE_CURSOR = '\u001b[?25l';

function ProgressBar({
  format, stream, total, width, complete, incomplete, head, clear, tokens
}) {
  this.stream = stream || process.stderr;
  this.format = format || '[$progress]';
  this.total = total || 10;
  this.value = 0;
  this.width = width || this.total;
  this.characters = {
    complete: complete || '=',
    incomplete: incomplete || ' ',
    head: head || '>'
  };
  this.clear = (clear === undefined) ? false : clear;
  this.tokens = tokens || { };

  this.complete = false;
  this.lastUpdate = false;
}

ProgressBar.prototype.progress = function(options) {
  if (this.complete) {
    return;
  }

  options = options || {};
  if (typeof options === 'number') {
    options = {
      increment: options
    };
  }

  options.increment = Number(options.increment) || 1;

  if (this.value === 0) {
    this.start = new Date();
  }

  this.value += options.increment;
  this.tokens = Object.assign(this.tokens, options.tokens || {});

  this.render();

  if (this.value >= this.total) {
    this.complete = true;
    this.done();
  }
};

ProgressBar.prototype.render = function() {
  const self = this;

  if (!self.stream.isTTY) {
    return;
  }

  let ratio = self.value / self.total;
  ratio = Math.min(Math.max(ratio, 0), 1);
  const percent = Math.floor(ratio * 100);
  const elapsed = new Date() - self.start;
  const eta = (percent === 100) ? 0 : elapsed * (self.total / self.value - 1);
  const rate = self.value / (elapsed / 1000);

  let string = self.format.
    replace(/\$value/g, self.value).
    replace(/\$total/g, self.total).
    replace(/\$elapsed/g, isNaN(elapsed) ? '0.0' : (elapsed / 1000).toFixed(1)).
    replace(/\$eta/g, (isNaN(eta) || !isFinite(eta)) ? '0.0' : (eta / 1000).toFixed(1)).
    replace(/\$percent/g, percent.toFixed(0) + '%').
    replace(/\$rate/g, Math.round(rate)).
    replace(/\$(.+?)\b/g, function(match, token) {
      if (self.tokens[token]) {
        return self.tokens[token];
      } else {
        if (token === 'progress') {
          return '$progress';
        } else {
          return '';
        }
      }
    });

  const columns = Math.max(0, self.stream.columns - string.replace(/\$progress/g, '').length);
  const width = Math.min(self.width, columns);
  const completeLength = Math.round(width * ratio);

  const complete = self.characters.complete.repeat(Math.max(0, completeLength)).
    replace(/.$/, (self.value >= self.total) ? self.characters.complete : self.characters.head);
  const incomplete = self.characters.incomplete.repeat(Math.max(0, width - completeLength));

  string = string.replace('$progress', complete + incomplete).
    replace(/\$progress/g, '');

  if (self.lastUpdate !== string) {
    self.stream.cursorTo(0);
    self.stream.write(`${ HIDE_CURSOR }${ string }`);
    self.stream.clearLine(1);
    self.lastUpdate = string;
  }
};

ProgressBar.prototype.done = function() {
  this.stream.write(SHOW_CURSOR);
  if (this.clear) {
    if (this.stream.clearLine) {
      this.stream.clearLine();
      this.stream.cursorTo(0);
    }
  } else {
    this.stream.write('\n');
  }
};

ProgressBar.prototype.reset = function() {
  this.value = 0;
  this.complete = 0;
  this.tokens = { };
};

module.exports = ProgressBar;
