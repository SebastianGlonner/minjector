define(['/hidden/Second'], function(Second) {
  var module = function() {
  };

  var second = new Second();

  module.prototype.third = function() {
    return 'third_' + second.second();
  };

  return module;
});
