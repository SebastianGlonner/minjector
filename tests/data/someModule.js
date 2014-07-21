define(function() {
  var module = function() {
  };

  module.prototype.anyAction = function() {
    return 'testAction';
  };

  return module;
});

define('someOtherModule', function() {
  var module = function() {
  };

  module.prototype.anyOtherAction = function() {
    return 'testOtherAction';
  };

  return module;
});
