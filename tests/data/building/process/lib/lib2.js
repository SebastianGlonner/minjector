// code should create notification.

var c = 'hm';
if (env)
  c = 'tesT';

define(function() {
  var lib = function() {
  };

  lib.prototype.is = function() {
    return 'lib1';
  };

  return lib;
});
