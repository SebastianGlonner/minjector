// comment does not create notification
define(function() {
  var lib = function() {
  };

  lib.prototype.is = function() {
    return 'lib3';
  };

  return lib;
});
