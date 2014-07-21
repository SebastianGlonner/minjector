define(
    function(RecursiveModule) {
      var module = function() {
      };
      module.prototype.getRecursive = function() {
        return 'callstack3';
      };

      return module;
    }
);
