define('lib1', ['lib5'], function() {
  var lib = function() {
  };

  lib.prototype.is = function() {
    return 'lib1';
  };

  return lib;
});
define('lib2', function() {
  var lib = function() {
  };

  lib.prototype.is = function() {
    return 'lib1';
  };

  return lib;
});
define('lib5', function() {
  var lib = function() {
  };

  lib.prototype.is = function() {
    return 'lib5';
  };

  return lib;
});
// initialize app.
// This should not create a notification during building.

var config = {};

// var m = new MinjectorClass(config);

define(['lib1', 'lib2'], function() {
  var module = function() {
  };

  module.prototype.is = function() {
    return 'mod2';
  };

  module.prototype.load = function(mod) {
    require(mod, function(Module) {

    });
  };

  return module;
});
