define(['dep1', 'Dep2'], function() {

});


define('parseTestExplicit', function() {

});


// Produce warning due to multiple anonym modules in one file ()
define(function() {

});


define('completeDefine', ['OneDep', 'SecondDep'], function() {});

var dynMod = 'Test';
// Produce warning about dynamic modules
define('dynTest1', [dynMod + 'Module'], function() {
  // test struc
});

function getModule() {
  return 'DynTestModule2';
}

define('dynTest2', [getModule()], function() {
  var test = require('dynTest1');
});

define('dynTest3' + dynMod, [getModule()], function() {
  // Test test
});

var stringTest1 = "with a define(function() {}); in it";

var stringTest2 = 'with a define(function() {}); in it';


define('InlineTest', function() {

  // Produce warning about inline module
  define('IamInlineModule', ['aDep'], function() {

  });

});

var hallo /* test var test = require('CommentTest1');*/= 'test'; // any comment;

// nother com var test = require('CommentTest2');

hallo = 'bad';

/*
var test = require('CommentTest3');
  Hallo multiline comments

 */
var damnVars = 'bad';

/****var test = require('CommentTest4');
 * Common multi-line comment style.
 ****/

var more = 'code';

/****
 * Another common multi-line comment style.
 */

var stringTest3 = "jao var test = require('CommentTest1');";

define('parseTestExplicit', ['require'], function(require) {
  var someFunc = function() {
    var test = require(['lala', 'Bla'], function() {

    });

    var stringTest4 = 'jao var test =' + require('CommentTest1') + ';';
  };
});


thisIsNo_define(function() {

});

define_FakeSecond(function() {

});

var thisOnesNotAswell = {
  define: define,
  anyOtherLabeldRef: define
};

thisOnesNotAswell.define('specializedModule1', function() {

});

thisOnesNotAswell.anyOtherLabeldRef('specializedModule2', function() {

});


