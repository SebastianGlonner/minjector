define(['./TrulyAbs1'], function(TrulyAbs1) {
  var module = function() {
  };

  var dep = new TrulyAbs1();

  module.prototype.relative2 = function() {
    return 'isRelative2_' + dep.TrulyAbs1();
  };

  return module;
});
