var ParsedCode = require('./ParsedCode');
var Token = require('./Token');
var State = require('./State');
var tokenProcessor = require('./tokenProcessor');


/**
 * All tokens of interest. @see var tokenIdentifier
 * @type {Array}
 */
var tokens = [
  // Swallow all right side whitespaces for easier and faster processing
  // {@see Token.isDesiredFuncCall()}.
  '(define)\\s*',
  '(require)\\s*',
  '(\\()',
  '(\\))',
  '(\\{)',
  '(\\})',
  '(\\[)',
  '(\\])',
  '(\\/\\/).*(?:\\r\\n|\\r|\\n)?',
  '(\\/\\*)',
  '(\\*\\/)',
  '"(\\\\.|[^"])*"',
  '\'(\\\\.|[^\'])*\'',
  '(,)'
];


/**
 * This array assign identifiers to the found tokens in {@see var tokens}
 * array. Therefore the indexes of the arrays are important and have to
 * correspond there token patterns.
 * @type {Array}
 */
var tokenIdentifier = [
  'define',
  'require',
  'roundBracketOpen',
  'roundBracketClose',
  'curlyBracketOpen',
  'curlyBracketClose',
  'arrayOpen',
  'arrayClose',
  'singleLineComment',
  'multiLineCommentOpen',
  'multiLineCommentClose',
  'stringDoubleQuoted',
  'stringSingleQuoted',
  'comma'
];

tokens = '(?:' + tokens.join('|') + ')';


/**
 * @type {object}
 */
module.exports = {

  TOKENS: tokens,
  TOKENS_IDENTIFIER: tokenIdentifier,

  parse: function(input) {
    var parsedCode = new ParsedCode(input);

    var regex = new RegExp(this.TOKENS, 'g');
    var state = new State();

    var i, l, execResult, TokenClass = Token;
    while ((execResult = regex.exec(input)) !== null) {
      // console.log(execResult);
      var token = null;
      for (i = 1, l = execResult.length; i < l; i++) {
        if (execResult[i] !== undefined) {
          token = execResult[i];

          break;
        }
      }

      tokenProcessor.consumeToken(
          state,
          parsedCode,
          new TokenClass(
              this.TOKENS_IDENTIFIER[i - 1],
              input,
              token,
              execResult.index,
              regex.lastIndex
          )
      );
    }

    return parsedCode;
  }
};
