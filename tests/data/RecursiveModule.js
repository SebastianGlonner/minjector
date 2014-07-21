define(
    ['recursive/Recursive1'],
    function(RecursiveModule) {
      var module = function() {
      };
      module.prototype.getRecursive = function() {
        return (new RecursiveModule()).getRecursive();
      };

      return module;
    }
);
