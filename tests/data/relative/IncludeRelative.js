define(['./NotAbsoluteInRelDir/'], function(NotAbsoluteInRelDir) {
  var module = function() {
  };

  var dep = new NotAbsoluteInRelDir();

  module.prototype.isRelative = function() {
    return 'isRelative_' + dep.goingRelative();
  };

  return module;
});
