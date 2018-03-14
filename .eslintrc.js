module.exports = {
  "env": {
    "node": true,
    "es6": true,
    "mocha": true
  },
  "globals": {
    "retry": true
  },
  "rules": {
    // Basic rules
    "no-empty": ["error", {                               // Don't allow empty block statements...
      "allowEmptyCatch": true                             // except for empty catch statements
    }],
    "indent": ["error", 2, {                              // Two spaces per indentation, no tabs allowed (fixable)
      "SwitchCase": 1                                     // Overrides default indentation enforcement for switch cases.
                                                          // Note integer represents number of indentation units.
                                                          // Ergo, 2 spaces/indentation * 1 indentation = 2 spaces
    }],
    "comma-spacing": "error",                             // Enforces `a, b`. Will reject `a,b` (fixable)
    "semi": "error",                                      // Enforces semicolons after statements (fixable)
    "space-infix-ops": "error",                           // Enforces spaces around operators (fixable)
    "space-before-blocks": "error",                       // Enforces spaces before { (fixable)
    "no-trailing-spaces": "error",                        // Enforces trailing whitespace (fixable)
    "comma-dangle": ["error", "never"],                   // No trailing commmas (fixable)
    "no-multi-spaces": "error",                           // One space per gap (fixable)
    "eol-last": "error",                                  // Mandate newlines at the end of files (fixable)
    "quotes": ["error", "single", {                        // Mandate single quotes (fixable)
      "avoidEscape": true
    }],
    "no-multiple-empty-lines": ["error", {
      "max": 1
    }],                                                   // No overuse of newlines (fixable)
    "eqeqeq": ["error", "always"],                        // Never use != or == (fixable)
    "key-spacing": ["error", {                            // Enforces spaces after colons in object literals
      "beforeColon": false,                               // i.e. `{a: b}` is valid `{a : b}` or `{a:b}` not valid
      "afterColon": true
    }],
    "no-dupe-args": "error",                              // Don't allow accidental duplication of arguments
    "no-dupe-keys": "error",                              // Don't allow duplication of keys in object literals
    "no-debugger": "error",                               // Don't allow submissions which retain debugger statements
    "no-caller": "error",                                 // No access of `caller` and `callee` attributes. Performance killers
    "no-undef": "error",                                  // Don't allow access of implicit globals
                                                          // (see above list of accepted globals)
    "keyword-spacing": "error",                           // Accept `if () {}`, reject `if() {}`
    "no-unreachable": "error",
    "no-cond-assign": ["error", "except-parens"],         // No assignments inside conditionals
    "no-sparse-arrays": "error",                          // No empty spaces in array literals
    "no-eval": "error",                                   // No using `eval` statements
    "no-loop-func": "error",                              // No hardcoding external loop iterators into functions
    "no-proto": "error",                                  // No using `__proto__` at all
    "no-with": "error",                                   // No using the `with` keyword
    "brace-style": ["error", "1tbs", {                    // Enforce 1tbs brace style (fixable)
      "allowSingleLine": true
    }],
    // Styling
    "array-bracket-spacing": [ // enforce spaces inside of brackets
      "error",
      "always"
    ],
    "dot-location": [ // enforce consistent newlines before and after dots
      "error",
      "object"
    ],
    "dot-notation": "error", // enforce dot notation whenever possible
    "no-const-assign": "error", // disallow reassigning const variables
    "no-constant-condition": "error", // disallow constant expressions in conditions
    "no-empty-character-class": "error", // disallow empty character classes in regular expressions
    "no-floating-decimal": "error", // disallow leading or trailing decimal points in numeric literals
    "no-mixed-requires": "error", // disallow require calls to be mixed with regular variable declarations
    "no-redeclare": "error", // disallow variable redeclaration
    "no-shadow": [ // disallow variable declarations from shadowing variables declared in the outer scope (no-shadow)
      "error",
      {
        "allow": [
          "resolve",
          "reject",
          "error",
          "response",
          "body"
        ]
      }
    ],
    "no-unmodified-loop-condition": "error", // disallow unmodified loop conditions
    "no-unused-expressions": "error", // disallow unused expressions
    "no-unused-vars": "error", // disallow unused variables
    "no-use-before-define": [ // disallow the use of variables before they are defined
      "error",
      "nofunc"
    ],
    "no-useless-call": "error", // disallow unnecessary calls to .call() and .apply()
    "no-useless-escape": "error", // disallow unnecessary escape characters
    "no-useless-return": "error", // disallow redundant return statements
    "no-var": "error", // require let or const instead of var
    "object-curly-newline": [ // enforce consistent line breaks inside braces
      "error",
      {
        "minProperties" : 1
      }
    ],
    "object-curly-spacing": [ // enforce consistent spacing inside braces
      "error",
      "always"
    ],
    "object-property-newline": "error", // enforce placing object properties on separate lines
    "one-var": [ // enforce variables to be declared separately in functions
      "error",
      "never"
    ],
    "one-var-declaration-per-line": "error", // require newlines around variable declarations
    "prefer-const": "error", // require const declarations for variables that are never reassigned after declared
    "prefer-promise-reject-errors": "error", // require using Error objects as Promise rejection reasons
    "strict": "error", // require strict mode directives
    "yoda": "error" // disallow Yoda conditions
  }
};
