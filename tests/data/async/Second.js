define(['async/Third'], function(Third) {
  var module = function() {
  };

  var third = new Third();

  module.prototype.second = function() {
    return 'second_' + third.third();
  };

  return module;
});
