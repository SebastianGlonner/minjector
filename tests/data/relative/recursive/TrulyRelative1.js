define(['../TrulyRelative2'], function(TrulyRelative2) {
  var module = function() {
  };

  var dep = new TrulyRelative2();

  module.prototype.TrulyRelative1 = function() {
    return 'TrulyRelative1_' + dep.TrulyRelative2();
  };

  return module;
});
