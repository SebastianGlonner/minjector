/**
 * Minjector element representing a "define" or "require" definition.
 *
 * @param {TokenStructure} tokenStructure The corresponding tokenStructure
 * of this element.
 * @param {string} type         "define" | "require"
 * @param {Token} firstBracketToken The token representing the first bracket of
 * the element e.g. "define   ->(<-"
 * @param {Param} id           The id of the module. Null for "require".
 * @param {Param} dependencies
 * @this {Element}
 */
var MinjectorElement = function(
    tokenStructure,
    type,
    firstBracketToken,
    id,
    dependencies) {
  this.tokenStructure = tokenStructure;
  this.type = type;
  this.firstBracketToken = firstBracketToken;
  this.id = id;
  this.dependencies = dependencies;
  this.parent = null;
  this.children = [];
};


/**
 * Prototype shortcut.
 * @type {object}
 */
var _pt = MinjectorElement.prototype;


/**
 * Return the element type.
 * @return {string}
 * @this {MinjectorElement}
 */
_pt.getType = function() {
  return this.type;
};


/**
 * Return the element dependencies param.
 * @return {Param}
 * @this {MinjectorElement}
 */
_pt.getDependencies = function() {
  return this.dependencies;
};


/**
 * Return the element id param.
 * @return {Param}
 * @this {MinjectorElement}
 */
_pt.getId = function() {
  return this.id;
};


/**
 * Return if this module is and inline element or has a parent.
 *
 * @return {Boolean}
 * @this {MinjectorElement}
 */
_pt.isInline = function() {
  return this.parent !== null;
};


/**
 * Set the parent element.
 * @param {MinjectorElement} parent
 * @this {MinjectorElement}
 */
_pt.setParent = function(parent) {
  this.parent = parent;
};


/**
 * Retrieve the parent element.
 * @return {MinjectorElement}
 * @this {MinjectorElement}
 */
_pt.getParent = function() {
  return this.parent;
};


/**
 * Add a children element.
 * @param {MinjectorElement} child
 * @this {MinjectorElement}
 */
_pt.addChildren = function(child) {
  this.children.push(child);
  child.setParent(this);
};


/**
 * Return all children of this element.
 * @return {array}
 * @this {MinjectorElement}
 */
_pt.getChildren = function() {
  return this.children;
};


/**
 * Return the code of this element. Inserting the given id as parameter if no
 * id exists per definition.
 *
 * @param {string} id The id which this module should have due to its file path.
 * @return {array}
 * @this {MinjectorElement}
 */
_pt.getCode = function(id) {
  var code = this.tokenStructure.getStructureCodePart();
  var idParam = this.getId();

  if (idParam === null || (!idParam.isDynamic() && idParam.getValue() === '')) {
    var firstBracketIndex = this.firstBracketToken.startIndex + 1;

    // Because the startIndex of firstBracketToken is relative to the file it
    // lives in but the code we extracted for this element the index does not
    // fit anylonger. Therefore substract the start index of the first token
    // to retrieve the correct index.
    firstBracketIndex -= this.tokenStructure.getTokens()[0].startIndex;

    code = code.substr(0, firstBracketIndex) + '\'' + id + '\', ' +
        code.substr(firstBracketIndex);
  }
  return code + ';\n';
};


/**
 * Representing a parameter of an element. The id or the dependencies.
 * @param {id|array} value        The value of the param.
 * @param {Boolean}  isDynamic    Is this a dynamic created value.
 * @this {Param}
 */
var Param = function(value, isDynamic) {
  this.value = value;
  this.dynamic = isDynamic === undefined ? false : isDynamic;
};


/**
 * Retrieve the value of this parameter. Null if this param is a dynamic value.
 * @return {id|array|null}
 */
Param.prototype.getValue = function() {
  return this.value;
};


/**
 * Return if this parameter has a dynamic computed value.
 * @return {Boolean}
 */
Param.prototype.isDynamic = function() {
  return this.dynamic;
};


/**
 * Set public access for the Param class.
 * @type {Param}
 */
MinjectorElement.Param = Param;


/**
 * @type {MinjectorElement}
 */
module.exports = MinjectorElement;
