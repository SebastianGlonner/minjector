define('single/ReverseWeRequire2', ['single/ReverseIamRequired'], function() {
  var module = function() {
  };

  module.prototype.weRequire2 = function() {
    return 'weRequire2';
  };

  return module;
});

define(['single/ReverseIamRequired'], function() {
  var module = function() {
  };

  module.prototype.weRequire1 = function() {
    return 'weRequire1';
  };

  return module;
});