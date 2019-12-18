'use strict';

const CSI = '\x1b[';

const sequences = {
  controlSequenceIntroducer: () => { return CSI; },
  cursorUp: (n) => { return `${ CSI }${ n || 1 }A`; },
  cursorDown: (n) => { return `${ CSI }${ n || 1 }B`; },
  cursorForward: (n) => { return `${ CSI }${ n || 1 }C`; },
  cursorBack: (n) => { return `${ CSI }${ n || 1 }D`; },
  cursorNextLine: (n) => { return `${ CSI }${ n || 1 }E`; },
  cursorPreviousLine: (n) => { return `${ CSI }${ n || 1 }F`; },
  cursorHorizontalAbsolute: (n) => { return `${ CSI }${ n || 1 }G`; },
  cursorPosition: (n, m) => { return `${ CSI }${ n || 1 };${ m || 1 }H`; },
  eraseInDisplay: (n) => { return `${ CSI }${ n || 0 }J`; },
  eraseLine: (n) => { return `${ CSI }${ n || 0 }K`; },
  scrollUp: (n) => { return `${ CSI }${ n || 1 }S`; },
  scrollDown: (n) => { return `${ CSI }${ n || 1 }T`; },
  horizontalVerticalPosition: (n, m) => { return `${ CSI }${ n || 1 };${ m || 1 }f`; },
  deviceStatusReport: () => { return `${ CSI }6n`; },
  saveCursorPosition: () => { return `${ CSI }s`; },
  restoreCursorPosition: () => { return `${ CSI }u`; },
  showCursor: () => { return `${ CSI }?25h`; },
  hideCursor: () => { return `${ CSI }?25l`; },
  enableAlternativeBuffer: () => { return `${ CSI }?1049h`; },
  disableAlternativeBuffer: () => { return `${ CSI }?1049l`; }
};

module.exports = { sequences };
