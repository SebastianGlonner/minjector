define(['async/Third'], function(Third) {
  var module = function() {
  };

  var third = new Third();

  module.prototype.first = function() {
    return 'first_' + third.third();
  };

  return module;
});
