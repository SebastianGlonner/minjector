var State = function() {
  this.scope = 0;
  this.parenthesis = 0;
  this.comment = false;
  this.trackBrackets = [];
  this.trackIndex = -1;
};

var _pt = State.prototype;

/**********************************\
 *
 * COMMENT FUNCTIONS
 *
\**********************************/

_pt.startCommentMulti = function() {
  this.comment = true;
};

_pt.resetComment = function() {
  this.comment = false;
};

_pt.isInsideMultiComment = function() {
  return this.comment === true;
};

/**********************************\
 *
 * SCOPING HANDLING
 *
\**********************************/

_pt.isTopLevelScope = function() {
  return this.scope === 0;
};

_pt.getScopeLevel = function() {
  return this.scope;
};

_pt.enterScope = function() {
  this.scope++;
};

_pt.leaveScope = function() {
  this.scope--;
};

/**********************************\
 *
 * PARENTHISIS HANDLING
 *
\**********************************/

_pt.enterParenthesis = function() {
  this.parenthesis++;
};

_pt.leaveParenthesis = function() {
  this.parenthesis--;
};

/**********************************\
 *
 * DEFINE HANDLING
 *
\**********************************/

_pt.isTrackingNextBracket = function() {
  return this.trackBrackets.length !== 0 &&
    this.trackBrackets[this.trackIndex].lvl === undefined;
};


_pt.pushOpeningBracket = function() {
  this.trackBrackets[this.trackIndex].lvl = this.parenthesis;
};


_pt.pullClosingBracket = function() {
  if (this.trackBrackets.length === 0)
    return false;

  if (this.trackBrackets[this.trackIndex].lvl === this.parenthesis) {
    this.trackIndex--;
    return this.trackBrackets.pop().type;
  }

  return null;
};


_pt.startTrackBrackets = function(type) {
  this.trackIndex = this.trackBrackets.push({
    type: type
  }) - 1;
};


module.exports = State;