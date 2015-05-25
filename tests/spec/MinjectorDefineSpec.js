describe('minjector define', function() {
  // ATTENTION:
  // This test spec is supposed to run in node AND browser.

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

  var isNodeJs =
      typeof exports !== 'undefined' && this.exports !== exports;

  if (isNodeJs) {
    var common = require('../../common.js');
    // require(config.DIR.BIN + 'minjector.min.js');
    require(common.INCLUDE + 'minjector.js');
  }

  beforeEach(function() {
    if (isNodeJs) {
      define.config({
        baseUrl: common.DIR.TESTS_DATA,
        libUrl: common.DIR.TESTS_DATA + 'lib/'
      });
    } else {
      // The minjector library will be loaded in the HTML spec file.
      define.config({
        baseUrl: './data/',
        libUrl: './data/lib/'
      });
    }
  });


  describe('can handle AMD define', function() {
    it('and accepts anonymous module', function(done) {
      define(function() {
        expect(true).toBe(true);
        done();
      });
    });

    it('with single anonym dependency', function(done) {

      define(['/AnonymModule'], function(AnyModule) {
        expect(typeof AnyModule).toBe('function');
        var init = new AnyModule();
        expect(init.isAno()).toBe('isAno');
        done();
      });
    });

    it('and accepts dependency with id', function(done) {
      define(['/depWithId'], function(depWithId) {
        expect(typeof depWithId).toBe('function');
        var init = new depWithId();
        expect(init.depId()).toBe('depId');
        done();
      });
    });

    it('and can handle empty modules', function(done) {
      // loading specific module id resulting in an file which does not
      // contain anonym modules nor a module with the requested id explicitly
      // set
      define(['/emptyModule', 'require'], function(emptyModule, require) {
        expect(emptyModule).toBe(undefined);
        require(['/emptyModule2'], function(emptyModule2) {
          expect(emptyModule2).toBe(undefined);
          done();
        });
      });
    });

    it('and modules in single file require same dependency', function(done) {
      define(['/single/WeRequire'], function(WeRequire) {
        expect(typeof WeRequire).toBe('function');
        var init = new WeRequire();
        expect(init.weRequire1()).toBe('weRequire1');

        define(['/single/WeRequire2'], function(WeRequire2) {
          expect(typeof WeRequire2).toBe('function');
          var init = new WeRequire2();
          expect(init.weRequire2()).toBe('weRequire2');

          if (!isNodeJs) {
            // To be sure that the "async/Thrid.js"
            // module was loaded once!
            var scriptList = document.scripts;
            var thirdScripts =
                Array.prototype.filter.call(
                    scriptList,
                    function(element) {
                      return /single\/IamRequired\.js/.test(
                          element.getAttribute('src')
                      );
                    }
                );
            expect(thirdScripts.length).toBe(1);
          }

          done();
        });
      });
    });

    var specName = 'and modules in single file require same dependency' +
        ' with independent define order';
    it(specName, function(done) {
      define(['/single/ReverseWeRequire'], function(WeRequire) {
        expect(typeof WeRequire).toBe('function');
        var init = new WeRequire();
        expect(init.weRequire1()).toBe('weRequire1');

        define(['/single/ReverseWeRequire2'], function(WeRequire2) {
          expect(typeof WeRequire2).toBe('function');
          var init = new WeRequire2();
          expect(init.weRequire2()).toBe('weRequire2');

          if (!isNodeJs) {
            // To be sure that the "async/Thrid.js"
            // module was loaded once!
            var scriptList = document.scripts;
            var thirdScripts =
                Array.prototype.filter.call(
                    scriptList,
                    function(element) {
                      return /single\/ReverseIamRequired\.js/.test(
                          element.getAttribute('src')
                      );
                    }
                );
            expect(thirdScripts.length).toBe(1);
          }

          done();
        });
      });
    });

    it('with mulitple mixed anonym/named modules', function(done) {
      define(['/Anonym2', '/Anonym3'], function(Anonym2, Anonym3) {
        expect(typeof Anonym2).toBe('function');
        var anonym2 = new Anonym2();
        expect(anonym2.isAno2()).toBe('isAno2');

        expect(typeof Anonym3).toBe('function');
        var anonym3 = new Anonym3();
        expect(anonym3.isAno3()).toBe('isAno3');
        done();
      });
    });

    it('with multiple dependencies in correct order', function(done) {
      define([
        '/ordered/First',
        '/ordered/Second',
        '/ordered/Third'
      ], function(First, Second, Third) {
        var initFirst = new First();
        expect(initFirst.firstAction()).toBe('firstAction');

        var initSecond = new Second();
        expect(initSecond.secondAction()).toBe('secondAction');

        var initThird = new Third();
        expect(initThird.thirdAction()).toBe('thirdAction');

        done();
      });
    });

    it('with nested dependencies', function(done) {
      define([
        '/NestedModule'
      ], function(NestedModule) {
        expect(typeof NestedModule).toBe('function');
        var nested = new NestedModule();
        expect(nested.is()).toBe('nestedModule');

        var RecursiveModule = nested.getNested();
        expect(typeof RecursiveModule).toBe('function');
        var initRecModule = new RecursiveModule();
        expect(initRecModule.myName()).toBe('recursiveModule');

        done();
      });
    });

    it('and handle unordered define\'s', function(done) {

      define(['/RequireNext'], function(RequireNext) {
        expect(typeof RequireNext).toBe('function');
        var init = new RequireNext();
        expect(init.heyhey()).toBe('heyhey_NextInThisFile');
        done();
      });
    });

    it('with multiple recursive dependencies', function(done) {
      define([
        '/RecursiveModule'
      ], function(RecursiveModule) {
        expect(typeof RecursiveModule).toBe('function');
        var rec = new RecursiveModule();
        expect(rec.getRecursive()).toBe('callstack3');

        done();
      });
    });

    it('and process all modules absolutely', function(done) {
      define(['/absolute/RelModule'], function(RelModule) {
        var initRelModule = new RelModule();
        expect(initRelModule.anyAction()).toBe('rel_relativ');
        done();
      });
    });

    it(
        'correctly wait for loading on multiple modules in single file',
        // The special case which we are testing here is that
        // in "hidden/First" file are 2 modules "First" and "Second",
        // but the "First" module depends on the "Third" which itself
        // depends on the "Second" module. Which should be in loading
        // state but even though recognized from the "Third" module as
        // "preset" (Do not try to load a file but wait for its completion).
        // The second module has a simple long loading dependency to
        // guarantee that the "Second" module is not loaded until we define
        // the "Third" module and recognize that we need the "Second" module
        // again.
        function(done) {
          define(
              [
                '/hidden/First'
              ],
              function(First) {
                expect(typeof First).toBe('function');
                var first = new First();
                expect(first.first()).toBe('first_third_second');

                if (!isNodeJs) {
                  // To be sure that the "async/Thrid.js"
                  // module was loaded once!
                  var scriptList = document.scripts;
                  var thirdScripts =
                      Array.prototype.filter.call(
                          scriptList,
                          function(element) {
                            return /hidden\/Third\.js/.test(
                                element.getAttribute('src')
                            );
                          }
                      );
                  expect(thirdScripts.length).toBe(1);
                }

                done();
              }
          );
        }
    );

    it(
        'correctly wait for loading if multiple modules depend on same module',
        // The special case which we are testing here is that
        // module "First" and "Second" depends on "Third". "Second" should
        // also wait until "First" loaded "Third" without requesting another
        // file.
        function(done) {
          define([
            '/async/First',
            '/async/Second'
          ],
          function(First, Second) {
            expect(typeof First).toBe('function');
            var first = new First();
            expect(first.first()).toBe('first_third');

            expect(typeof Second).toBe('function');
            var second = new Second();
            expect(second.second()).toBe('second_third');

            if (!isNodeJs) {
              // To be sure that the "async/Thrid.js" module was loaded once!
              var scriptList = document.scripts;
              var thirdScripts =
                  Array.prototype.filter.call(
                      scriptList,
                      function(element) {
                        return /async\/Third\.js/
                          .test(element.getAttribute('src'));
                      }
                  );
              expect(thirdScripts.length).toBe(1);
            }

            done();
          });
        }
    );

    it('can mockup modules for testing purpose', function(done) {
      var MMM = function() {};
      MMM.prototype.mockupMethod = function() {
        return 'faking behaviour';
      };

      define.minjector.mockModule('/MyMockedModule', MMM);

      define(['/MyMockedModule'], function(MyMockedModule) {
        expect(typeof MyMockedModule).toBe('function');
        var mmm = new MyMockedModule();
        expect(mmm.mockupMethod()).toBe('faking behaviour');
        done();
      });
    });

    it('handle different ids cause relative origins through unique absolute path\'s', function(done) {
      // Tricky thing here is that module "/path/is/definite" gets referenced
      // twice from different path's and therefore with differen "ids"
      // once here with "/path/is/definite"
      // and one in module "/path/origin" with relative path "./is/definite"
      define(['/path/is/definite', '/path/origin'], function(definite, origin) {
        expect(definite).toBe('definite99');
        expect(origin).toBe('independent_definite99');

        if (!isNodeJs) {
          // To be sure that the "/path/is/definite.js" module was loaded once!
          var scriptList = document.scripts;
          var thirdScripts =
              Array.prototype.filter.call(
                  scriptList,
                  function(element) {
                    return /path\/is\/definite.js/
                      .test(element.getAttribute('src'));
                  }
              );
          expect(thirdScripts.length).toBe(1);
        }

        done();
      });
    });

  });
});
