'use strict';

Math.$random = function(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
