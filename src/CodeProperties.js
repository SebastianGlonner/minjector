/**
 * Representing a collection of properties of a given parsed code.
 *
 * @param {ParsedCode} parsedCode
 * @this {CodeProperties}
 */
var CodeBaseProperties = function(parsedCode) {
  this.parsedCode = parsedCode;
  this.properties = {};
};


/**
 * Prototype shortcut.
 * @type {object}
 */
var _pt = CodeProperties.prototype;



_pt.PROP_HAS_INLINE_DEFINE = 'inline.define';
_pt.PROP_HAS_INLINE_DEFINE = 'inline.define';


/**
 * @type {CodeProperties}
 */
module.exports = CodeProperties;
