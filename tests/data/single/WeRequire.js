define(['/single/IamRequired'], function() {
  var module = function() {
  };

  module.prototype.weRequire1 = function() {
    return 'weRequire1';
  };

  return module;
});

define('/single/WeRequire2', ['/single/IamRequired'], function() {
  var module = function() {
  };

  module.prototype.weRequire2 = function() {
    return 'weRequire2';
  };

  return module;
});
