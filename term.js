'use strict';

const CSI = '\x1b[';
const CPR_REGEXP = /\x1b\[(\d+);(\d+)R/;

const sequences = {
  controlSequenceIntroducer: () => CSI,
  cursorUp: (n) => `${ CSI }${ n || 1 }A`,
  cursorDown: (n) => `${ CSI }${ n || 1 }B`,
  cursorForward: (n) => `${ CSI }${ n || 1 }C`,
  cursorBack: (n) => `${ CSI }${ n || 1 }D`,
  cursorNextLine: (n) => `${ CSI }${ n || 1 }E`,
  cursorPreviousLine: (n) => `${ CSI }${ n || 1 }F`,
  cursorHorizontalAbsolute: (n) => `${ CSI }${ n || 1 }G`,
  cursorPosition: (n, m) => `${ CSI }${ n || 1 };${ m || 1 }H`,
  eraseInDisplay: (n) => `${ CSI }${ n || 0 }J`,
  eraseLine: (n) => `${ CSI }${ n || 0 }K`,
  scrollUp: (n) => `${ CSI }${ n || 1 }S`,
  scrollDown: (n) => `${ CSI }${ n || 1 }T`,
  horizontalVerticalPosition: (n, m) => `${ CSI }${ n || 1 };${ m || 1 }f`,
  deviceStatusReport: () => `${ CSI }6n`,
  saveCursorPosition: () => `${ CSI }s`,
  restoreCursorPosition: () => `${ CSI }u`,
  showCursor: () => `${ CSI }?25h`,
  hideCursor: () => `${ CSI }?25l`,
  enableAlternativeBuffer: () => `${ CSI }?1049h`,
  disableAlternativeBuffer: () => `${ CSI }?1049l`,
};

function cursorPosition () {
  return new Promise((resolve) => {
    if (!process.stdout.isTTY) {
      return resolve({
        x: 1,
        y: 1,
      });
    }

    const handler = (data) => {
      data = data.toString();
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
