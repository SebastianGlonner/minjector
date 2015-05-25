define(['./recmap'], function(RecMapped) {
  var module = function() {
  };

  var recMap = new RecMapped();

  module.prototype.toString = function() {
    return 'is_mapped_2' + recMap.toString();
  };

  return module;
});
