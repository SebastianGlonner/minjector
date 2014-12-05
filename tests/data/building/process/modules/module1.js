define(['lib1', 'lib3'], function() {
  var module = function() {
  };

  module.prototype.is = function() {
    return 'mod1';
  };

  return module;
});
