define(['./recursive/TrulyRelative1'], function(TrulyRelative1) {
  var module = function() {
  };

  var dep = new TrulyRelative1();

  module.prototype.TrulyAbs1 = function() {
    return 'TrulyAbs1_' + dep.TrulyRelative1();
  };

  return module;
});
