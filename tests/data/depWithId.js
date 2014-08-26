define('/depWithId', function() {
  var module = function() {
  };

  module.prototype.depId = function() {
    return 'depId';
  };

  return module;
});
