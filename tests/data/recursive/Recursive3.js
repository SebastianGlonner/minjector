define(
    function() {
      var module = function() {
      };
      module.prototype.getRecursive = function() {
        return 'callstack3';
      };

      return module;
    }
);
