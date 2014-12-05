define(
  ['/nested/RecursiveModule'],
  // ['NestedRecursiveModule'],
  function(RecursiveModule) {
    var module = function() {
    };

    module.prototype.is = function() {
      return 'nestedModule';
    };

    module.prototype.getNested = function() {
      return RecursiveModule;
    };

    return module;
  }
);
