define(['lib1', 'lib3', 'lib4'], function() {
  // lib3 should create notification
  // lib1 should not be inserted into this main file.
  var module = function() {
  };

  module.prototype.is = function() {
    return 'mod2';
  };

  return module;
});
