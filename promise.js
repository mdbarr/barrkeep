'use strict';

function parseRetryOptions (options) {
  options = options || { };

  if (options.parsed) {
    return options;
  }

  options = Object.clone(options);

  if (typeof options === 'number') {
    if (options < 1000) {
      options = { count: options };
    } else {
      options = { timeout: options };
    }
  }
  // don't use count by default
  if (typeof options.count !== 'number') {
    options.count = -1;
  }
  // 100ms default delay
  if (typeof options.delay !== 'number') {
    options.delay = 100;
  }
  // 30s default timeout
  if (typeof options.timeout !== 'number') {
    if (options.count > 0) {
      options.timeout = 0;
    } else {
      options.timeout = 30000;
    }
  }

  options.parsed = true;
  return options;
}

// Promise extension for a delay
Promise.delay = Promise.prototype.delay = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(timeout);
    }, timeout);
  });
};

Promise.sleep = Promise.prototype.sleep = Promise.prototype.delay;

// Validator promises
const validation = {
  ok (value) {
    return Promise.resolve(value ? value : true);
  },
  fail (reason) {
    return Promise.reject(reason ? reason : 'validation failed');
  }
};

/**
 * Promise retry mechanisms
 */
function timeoutPromise (promise, options, value, context) {
  return new Promise((resolve, reject) => {
    try {
      promise.bind(context)(value).then((result) => {
        resolve(result);
      }, (error) => {
        options.lastError = error;
        setTimeout(() => {
          reject(error);
        }, options.delay);
      });
    } catch (error) {
      options.lastError = error;
      setTimeout(() => {
        reject(error);
      }, options.delay);
    }
  });
}

/**
 * Retry a promise
 */
const retry = function (promise, options, value, context) {
  options = parseRetryOptions(options);
  options.start = options.start || Date.now();
  if (typeof options.counter !== 'number') {
    options.counter = -1;
  }
  let errorMessage;
  if (options.timeout > 0 && Date.now() > options.start + options.timeout) {
    errorMessage = `timeout of ${ options.timeout } ms exceeded (${ options.counter } attempts).`;
  }
  if (options.count > 0 && options.counter >= options.count - 1) {
    errorMessage = `retry count of ${ options.count } exceeded.`;
  }
  if (errorMessage) {
    const error = new Error(errorMessage);
    if (options.lastError) {
      error.stack = options.lastError.stack;
    }
    throw error;
  }

  options.counter++;

  return timeoutPromise(promise, options, value, context).
    then((result) => {
      return result;
    }, (error) => {
      if (error && (error.name === 'ReferenceError' || error.name === 'SyntaxError' ||
                    error.name === 'TypeError' || error.name === 'RangeError' ||
                    error.name === 'EvalError' || error.name === 'InternalError' ||
                    error.name === 'URIError' || error.name === 'UnhandledUrlParameterError' ||
                    error.name === 'RetryError' || error.group && error.group === 'RetryError')) {
        throw error;
      } else {
        return retry(promise, options, value, context);
      }
    });
};

// Promise extension for retry as a then-able
Promise.prototype.thenRetry = function (promise, options) {
  return this.then((value) => {
    return retry(promise, options, value);
  });
};

module.exports = {
  retry,
  validation
};
