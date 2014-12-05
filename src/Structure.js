var Structure = function(identifier) {
  this.identifier = identifier;
  this.tokena = [];
};

var _pt = Token.prototype;

_pt.getStartIndex = function() {
  return this.startIndex;
};

_pt.getLastIndex = function() {
  return this.lastIndex;
};

_pt.getInput = function() {
  return this.input;
};

module.exports = Structure;