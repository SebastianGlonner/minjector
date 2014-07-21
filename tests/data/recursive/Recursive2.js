define(
    ['recursive/Recursive3'],
    function(RecursiveModule) {
      var module = function() {
      };
      module.prototype.getRecursive = function() {
        return (new RecursiveModule()).getRecursive();
      };

      return module;
    }
);
