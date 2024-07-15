'use strict';

function parseRetryOptions (input = {}) {
  if (input.parsed) {
    return input;
  }

  let options = input;
  if (typeof options === 'number') {
    if (options < 1000) {
      options = { count: options };
    } else {
      options = { timeout: options };
    }
  } else {
    options = { ... input };
  }

  if (typeof options.count !== 'number') {
    options.count = -1;
  }

  if (typeof options.delay !== 'number') {
    options.delay = 100;
  }

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

function delay (timeout = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(timeout);
    }, timeout);
  });
}

const validation = {
  fail (reason) {
    return Promise.reject(reason ? reason : 'validation failed');
  },
  ok (value) {
    return Promise.resolve(value ? value : true);
  },
};

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

const retry = function (promise, input, value, context) {
  const options = parseRetryOptions(input);
  options.start ||= Date.now();
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
    then((result) => result, (error) => {
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

module.exports = {
  delay,
  retry,
  validation,
};
