'use strict';

const process = require('node:process');

const CSI = '\x1b[';
// eslint-disable-next-line no-control-regex
const CPR_REGEXP = /\x1b\[(\d+);(\d+)R/u;

const sequences = {
  controlSequenceIntroducer: () => CSI,
  cursorBack: (n) => `${ CSI }${ n || 1 }D`,
  cursorDown: (n) => `${ CSI }${ n || 1 }B`,
  cursorForward: (n) => `${ CSI }${ n || 1 }C`,
  cursorHorizontalAbsolute: (n) => `${ CSI }${ n || 1 }G`,
  cursorNextLine: (n) => `${ CSI }${ n || 1 }E`,
  cursorPosition: (n, m) => `${ CSI }${ n || 1 };${ m || 1 }H`,
  cursorPreviousLine: (n) => `${ CSI }${ n || 1 }F`,
  cursorUp: (n) => `${ CSI }${ n || 1 }A`,
  deviceStatusReport: () => `${ CSI }6n`,
  disableAlternativeBuffer: () => `${ CSI }?1049l`,
  enableAlternativeBuffer: () => `${ CSI }?1049h`,
  eraseInDisplay: (n) => `${ CSI }${ n || 0 }J`,
  eraseLine: (n) => `${ CSI }${ n || 0 }K`,
  hideCursor: () => `${ CSI }?25l`,
  horizontalVerticalPosition: (n, m) => `${ CSI }${ n || 1 };${ m || 1 }f`,
  restoreCursorPosition: () => `${ CSI }u`,
  saveCursorPosition: () => `${ CSI }s`,
  scrollDown: (n) => `${ CSI }${ n || 1 }T`,
  scrollUp: (n) => `${ CSI }${ n || 1 }S`,
  showCursor: () => `${ CSI }?25h`,
};

function cursorPosition () {
  return new Promise((resolve) => {
    if (!process.stdout.isTTY) {
      return resolve({
        x: 1,
        y: 1,
      });
    }

    const handler = (input) => {
      const data = input.toString();
      if (CPR_REGEXP.test(data)) {
        const [ , y, x ] = data.match(CPR_REGEXP);

        process.stdin.setRawMode(false);
        process.stdin.off('data', handler);
        process.stdin.unref();

        return resolve({
          x,
          y,
        });
      }

      return data;
    };

    process.stdin.setRawMode(true);
    process.stdin.on('data', handler);
    process.stdout.write(sequences.deviceStatusReport());
    return true;
  });
}

module.exports = {
  cursorPosition,
  sequences,
};
