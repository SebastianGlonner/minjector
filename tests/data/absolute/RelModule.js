define(['/RootPathModule'], function(RootPathModule) {
  var module = function() {
  };

  var initRootPathModule = new RootPathModule();
  module.prototype.anyAction = function() {
    return 'rel_' + initRootPathModule.relativ();
  };

  return module;
});
