
define(['/NextInThisFile'], function(NextInThisFile) {
  var module = function() {
  };

  var init = new NextInThisFile();

  module.prototype.heyhey = function() {
    return 'heyhey_' + init.theNext();
  };

  return module;
});

define('/NextInThisFile', function() {
  var module = function() {
  };

  module.prototype.theNext = function() {
    return 'NextInThisFile';
  };

  return module;
});