define(['hidden/Third'], function(Third) {
  var module = function() {
  };

  var third = new Third();

  module.prototype.first = function() {
    return 'first_' + third.third();
  };

  return module;
});

define('hidden/Second', ['hidden/SecondDep'], function() {
  var module = function() {
  };

  module.prototype.second = function() {
    return 'second';
  };

  return module;
});
