define(['getMapped2'], function(RecMapped) {
  var module = function() {
  };

  var recMap = new RecMapped();

  module.prototype.toString = function() {
    return 'is_mapped_' + recMap.toString();
  };

  return module;
});
