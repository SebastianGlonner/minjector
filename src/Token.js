var Token = function(identifier, code, token, startIndex, lastIndex) {
  this.identifier = identifier;
  this.code = code;
  this.token = token;
  this.startIndex = startIndex;
  this.lastIndex = lastIndex;
};

var _pt = Token.prototype;

_pt.fnCallAllowedLeftCharRegex = /\s/;

_pt.getIdentifier = function() {
  return this.identifier;
};

_pt.getCode = function() {
  return this.code;
};

_pt.getToken = function() {
  return this.token;
};

_pt.getStartIndex = function() {
  return this.startIndex;
};

_pt.getLastIndex = function() {
  return this.lastIndex;
};

/**
 * Testing if the given token is a function call of this pure token. Means
 * of we have no more word characters on left and right side of this token.
 *   " define(" => true
 *   "define " => true
 *   "adefine(" => false
 *   "_define(" => false
 *   " define2(" => false
 *   " define_(" => false
 *   " definee(" => false
 *   ".define(" => false
 *   " define.e(" => false
 *
 *   // The parser swallows all right side whitespaces. Therefor this is false
 *   // as well, resulting in easier processing and better performance
 *   " define (" => false
 *
 * @return {Boolean} [description]
 */
_pt.isDesiredFuncCall = function() {
  // We are at the very beginning of the code
  var isNonWordChar = this.startIndex === 0 ||
      // or the char before this token is whitespace
      this.fnCallAllowedLeftCharRegex.test(
          this.code.charAt(this.startIndex - 1)
      ) === true;

  if (isNonWordChar) {
    return this.code.charAt(this.lastIndex) === '(';
  }

  return false;
};

module.exports = Token;