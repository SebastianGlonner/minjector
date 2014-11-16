define(['require'], function(require) {

  return {
    doRelRequire: function(callback) {
      require(['./RequireRelModule'], function(RelModValue) {
        callback(RelModValue);
      });
    }
  };
});
