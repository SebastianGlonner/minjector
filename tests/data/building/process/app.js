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
