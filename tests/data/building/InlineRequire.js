define(['./Dep1', './Dep2'], function() {

  require(['./InDep3'], function() {

  });

  define('any', ['./nested/InlineDef1'], function() {

  });

  require(['./InDep4'], function() {

    require(['./RecInDep5'], function() {

    });
  });
});
