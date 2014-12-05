define(['require'], function(require) {

  return {
    doRelRequire: function(callback) {
      require(['./nested/RequireRelModule'], function(relModValue) {
        require(['./relative/Crank'], function(Crank) {
          callback(relModValue + Crank);
        });
      });
    }
  };
});
