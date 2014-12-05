var TokenStructure = require('./TokenStructure');


/**
 * Representing the parsed results of an specific code.
 * Offers method to create the parsed elements.
 *
 * @param {string} code
 * @this {ParsedCode}
 */
var ParsedCode = function(code) {
  this.code = code;
  this.elements = [];
  this.defines = null;
  this.requires = null;

  this.doTrack = [];
  this.trackIndex = -1;

  this.relations = {};
};


/**
 * Prototype shortcut.
 * @type {object}
 */
var _pt = ParsedCode.prototype;


/**
 * Return the code which was parsed.
 * @return {string}
 * @this {ParsedCode}
 */
_pt.getCode = function() {
  return this.code;
};


/**
 * Return array of {MinjectorElement} all found elements, at top level and
 * inline.
 * @return {arry}
 * @this {ParsedCode}
 */
_pt.getElements = function() {
  return this.elements;
};


/**
 * Return array of {MinjectorElement} of all found "define" definitions in the
 * given input at top level (no parent element).
 * @return {arry}
 * @this {ParsedCode}
 */
_pt.getDefines = function() {
  if (this.defines === null)
    this.defines = this.extractRootElementsByType('define');

  return this.defines;
};


/**
 * Return array of {MinjectorElement} of all found "require" definitions in the
 * given input at top level (no parent element).
 * @return {arry}
 * @this {ParsedCode}
 */
_pt.getRequires = function() {
  if (this.requires === null)
    this.requires = this.extractRootElementsByType('require');

  return this.requires;
};


/**
 * Extract top level elements of specific type.
 * @param  {string} type
 * @return {array}
 * @this {ParsedCode}
 */
_pt.extractRootElementsByType = function(type) {
  var res = [], element, i, l;
  for (i = 0, l = this.elements.length; i < l; i++) {
    element = this.elements[i];
    if (element.getParent() === null && element.getType() === type)
      res.push(element);
  }

  return res;
};


/**
 * Start tracking a token structure representing an element definition.
 * @param  {Token} token
 * @this {ParsedCode}
 */
_pt.startTrack = function(token) {
  this.trackIndex++;
  this.doTrack.push([]);
};


/**
 * Create the curent tracked element and apply realtions in dependence of
 * the given type.
 * @param  {string}  type
 * @param  {boolean} isTopLevelScope
 * @this {ParsedCode}
 */
_pt.finishElement = function(type, isTopLevelScope) {
  var element = new TokenStructure(
      this.code,
      this.doTrack.pop(),
      isTopLevelScope);

  element = element.toElement(type);

  var elementIdx = this.elements.push(element);

  this.trackIndex--;

  if (this.trackIndex > -1) {
    this.addRelation(elementIdx - 1, this.trackIndex);
  }

  this.applyRelations(element, this.trackIndex + 1);

};


/**
 * Add token to the last started tracking structure.
 * @param {Token} token
 * @return {boolean} Return false if no tracking is in process.
 * @this {ParsedCode}
 */
_pt.addToken = function(token) {
  if (this.doTrack.length === 0)
    return false;

  this.doTrack[this.trackIndex].push(token);
  return true;
};


/**
 * Add relation of an element index appropriate to the current tracking index.
 * @param {int} elementIdx The index of the element which is a child
 * @param {int} parentTrackingIndex The tracking index of the parent element
 * this child is child of.
 * @this {ParsedCode}
 */
_pt.addRelation = function(elementIdx, parentTrackingIndex) {
  if (this.relations[parentTrackingIndex]) {
    this.relations[parentTrackingIndex].push(elementIdx);
  } else {
    this.relations[parentTrackingIndex] = [elementIdx];
  }
};


/**
 * Add all tracked children to the given element by the given tracking
 * index {@see this.addRelation}.
 * @param  {MinjectorElement} element
 * @param  {int} parentTrackingIndex
 * @this {ParsedCode}
 */
_pt.applyRelations = function(element, parentTrackingIndex) {
  var relations = this.relations[parentTrackingIndex];
  if (relations) {
    var relationIdx, i, l;
    for (i = 0, l = relations.length; i < l; i++) {
      relationIdx = relations[i];
      element.addChildren(this.elements[relationIdx]);
    }
    this.relations[parentTrackingIndex] = null;
  }
};


/**
 * @type {ParsedCode}
 */
module.exports = ParsedCode;
