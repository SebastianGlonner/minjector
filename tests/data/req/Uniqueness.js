define('GetLocalRequired', function() {
  var M = function() {};
  M.prototype.uniquee = function() {
    return 'uniquee2';
  };

  return M;

});
// Any local anonym module.
define(['require'], function(require) {
  var M = function() {};
  M.prototype.uniquee = function() {
    return 'uniquee';
  };

  M.prototype.doRequireModule = function(callback) {
    var syncRequired = require('GetLocalRequired');

    var requireDone = [];
    var doCallCallback = function() {
      if (requireDone.length === 2)
        callback();
    };

    var asyncRequired = require(['GetLocalRequired'], function() {
      var nestedAsyncRequired = require(['GetLocalRequired'], function() {
        requireDone.push(true);
        doCallCallback();
      });
    });

    var multipleRequires = require(['GetLocalRequired'], function() {
      var nestedAsyncRequired = require(['GetLocalRequired'], function() {
        requireDone.push(true);
        doCallCallback();
      });
    });
  };

  return M;
});
