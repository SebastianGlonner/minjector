var tokenStructure2Element = require('./tokenStructure2Element.js');


/**
 * Representing a collection of tokens inside the given code representing
 * a specific definition e.g. "define(...)" or "require(...)".
 * @param {string}  code
 * @param {array}  tokens
 * @param {Boolean} isTopLevelScope
 * @this {TokenStructure}
 */
var TokenStructure = function(code, tokens, isTopLevelScope) {
  this.code = code;
  this.tokens = tokens;
  this.isTopLevelScope = !isTopLevelScope;
};


/**
 * Prototype shortcut.
 * @type {object}
 */
var _pt = TokenStructure.prototype;


/**
 * Get all tokens.
 * @return {array}
 * @this {TokenStructure}
 */
_pt.getTokens = function() {
  return this.tokens;
};


/**
 * Return the complete code where the tokens of this structure where found in.
 * The Token's startIndex and lastIndex corresponds to this string.
 * @return {string}
 * @this {TokenStructure}
 */
_pt.getCode = function() {
  return this.code;
};


/**
 * Return whether or not if this structure exists at top level scope.
 * @return {boolean}
 * @this {TokenStructure}
 */
_pt.atTopLevelScope = function() {
  return this.isTopLevelScope;
};


/**
 * Return a substring of the {@see this.code} representing this
 * token structure.
 * Simply code.substring(startToken.startIndex, lastToken.lastIndex).
 *
 * @return {string}
 * @this {TokenStructure}
 */
_pt.getStructureCodePart = function() {
  return this.code.substring(
      this.tokens[0].getStartIndex(),
      this.tokens[this.tokens.length - 1].getLastIndex()
  );
};


/**
 * Create {MinjectorElement} of the given type and this token structure.
 * @param  {string} type
 * @return {MinjectorElement}
 * @this {TokenStructure}
 */
_pt.toElement = function(type) {
  if (type === 'define')
    return tokenStructure2Element.toDefine(this);

  return tokenStructure2Element.toRequire(this);
};


/**
 * @type {TokenStructure}
 */
module.exports = TokenStructure;
