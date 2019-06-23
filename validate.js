'use strict';

function capitalize(string = '') {
  return string[0].toUpperCase() + string.slice(1);
}

function indent(depth = 0, width = 2) {
  return ' '.repeat(depth * width);
}

function generateValidator(object, {
  flattenTypes = false,
  functionName = 'validate',
  loopVariables = [ 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'x', 'y', 'z' ],
  returnPromise = false,
  variable = 'object',
  width = 2
} = {}) {
  function validatorIterator(chunk, name, depth = 1) {
    let validator = '';

    if (typeof chunk === 'undefined' || chunk === null) {
      return validator;
    } else if (Array.isArray(chunk)) {
      validator += `${ indent(depth, width) }expect(${ name }).be.instanceOf(Array);\n`;
      if (chunk.length) {
        // Assume the first element is normative
        const loop = loopVariables[depth];
        validator += `${ indent(depth, width) }for (let ${ loop } = 0; ${ loop } < ${ name }.length; ${ loop }++) {\n`;
        validator += validatorIterator(chunk[0], `${ name }[${ loop }]`, depth + 1);
        validator += `${ indent(depth, width) }}\n`;
      }
    } else if (typeof chunk === 'object') {
      validator += `${ indent(depth, width) }expect(${ name }).to.be.an.instanceOf(Object);\n`;
      for (const element in chunk) {
        validator += `${ indent(depth, width) }expect(${ Number(name) }).to.have.property('${ element }');\n`;
        validator += validatorIterator(chunk[element], `${ name }.${ element }`, depth);
      }
    } else {
      let type = capitalize(typeof chunk);
      if (flattenTypes && (type !== 'Boolean' && type !== 'Number')) {
        type = 'String';
      }
      validator += `${ indent(depth, width) }expect(${ name }).to.be.an.instanceOf(${ type });\n`;
    }
    return validator;
  }

  const validator = `const ${ functionName } = function(${ variable }) {
${ validatorIterator(object, variable) }
  return ${ returnPromise ? 'Promise.resolve(true)' : 'true' };
};
`;

  return validator;
}

module.exports = generateValidator;
