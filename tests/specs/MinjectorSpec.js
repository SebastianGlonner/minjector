describe('minjector', function() {
  // ATTENTION:
  // This test spec is supposed to run in node AND browser.

  var isNodeJs =
      typeof exports !== 'undefined' && this.exports !== exports;

  if (isNodeJs) {
    var config = require(process.cwd() + '/bootstrap.node.js');
    require(config.DIR.SRC + 'minjector');

    Minjector.config({
      baseUrl: config.DIR.TESTS_DATA
    });
  } else {
    // The minjector library will be loaded in the HTML spec file.
    Minjector.config({
      baseUrl: './data/'
    });
  }


  describe('can handle AMD define', function() {

    it('and accepts anonymous module', function(done) {
      define(function() {
        done();
      });
    });

    it('with single anonym module', function(done) {

      define(['AnonymModule'], function(AnyModule) {
        expect(typeof AnyModule).toBe('function');
        var init = new AnyModule();
        expect(init.isAno()).toBe('isAno');
        done();
      });
    });

    it('with mulitple anonym modules', function(done) {
      define(['InvalidModule'], function(AnyModule) {
        expect(typeof AnyModule).toBe('object');
        expect(AnyModule.anonym2).toBe(2);
        done();
      });
    });

    it('and accepts dependency with id', function(done) {
      define(['depWithId'], function(AnyModule) {
        expect(typeof AnyModule).toBe('function');
        var init = new AnyModule();
        expect(init.depId()).toBe('depId');
        done();
      });
    });

    it('and accepts file path as module id', function(done) {
      define(['someModule'], function(someModule) {
        var initSomeModule = new someModule();
        expect(initSomeModule.anyAction()).toBe('testAction');
        done();
      });
    });

    it('with mulitple mixed anonym/named modules', function(done) {
      define(['InvalidModule', 'someModule'], function(AnyModule, someModule) {
        expect(typeof AnyModule).toBe('object');
        expect(AnyModule.anonym2).toBe(2);

        var initSomeModule = new someModule();
        expect(initSomeModule.anyAction()).toBe('testAction');
        done();
      });
    });

    it('and accepts file path as module id', function(done) {
      define(['someModule'], function(someModule) {
        var initSomeModule = new someModule();
        expect(initSomeModule.anyAction()).toBe('testAction');
        done();
      });
    });

    it('with multiple dependencies in correct order', function(done) {
      // Third one was never loaded yet
      // to guarantee a async call (at least in browser)
      // and no cached loading
      define([
        'someModule',
        'thirdModule',
        'someOtherModule'
      ], function(someModule, thirdModule, someOtherModule) {
        var initSomeModule = new someModule();
        expect(initSomeModule.anyAction()).toBe('testAction');

        var initThirdModule = new thirdModule();
        expect(initThirdModule.thirdAction()).toBe('thirdAction');

        var initSomeOtherModule = new someOtherModule();
        expect(initSomeOtherModule.anyOtherAction()).toBe('testOtherAction');

        done();
      });
    });

    it('with nested dependencies', function(done) {
      define([
        'NestedModule'
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

    it('with multiple recursive dependencies', function(done) {
      define([
        'RecursiveModule'
      ], function(RecursiveModule) {
        expect(typeof RecursiveModule).toBe('function');
        var rec = new RecursiveModule();
        expect(rec.getRecursive()).toBe('callstack3');

        done();
      });
    });

    it(
        'correctly wait for loading on multiple modules in single file',
        // The special case which we are testing here is that
        // in "hiddenFirst" file are module are 2 modules "First" and "Second",
        // but the "First" module depends on the "Third" which itself
        // depends on the "Second" module. Which should be in loading
        // state but even though recognized from the "Third" module as
        // "preset" (Do not try to load a file but wait for its completion).
        function(done) {
          define([
            'hidden/First'
          ], function(First) {
            expect(typeof First).toBe('function');
            var first = new First();
            expect(first.first()).toBe('first_third_second');

            // To be sure that the "async/Thrid.js" module was loaded once!
            var scriptList = document.scripts;
            var thirdScripts = Array.prototype.filter.call(
                scriptList,
                function(element) {
                  return /hidden\/Third\.js/.test(element.getAttribute('src'));
                }
           );
            expect(thirdScripts.length).toBe(1);

            done();
          });
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
            'async/First',
            'async/Second'
          ],
          function(First, Second) {
            expect(typeof First).toBe('function');
            var first = new First();
            expect(first.first()).toBe('first_third');

            expect(typeof Second).toBe('function');
            var second = new Second();
            expect(second.second()).toBe('second_third');

            // To be sure that the "async/Thrid.js" module was loaded once!
            var scriptList = document.scripts;
            var thirdScripts = Array.prototype.filter.call(
                scriptList,
                function(element) {
                  return /async\/Third\.js/.test(element.getAttribute('src'));
                }
           );
            expect(thirdScripts.length).toBe(1);

            done();
          });
        }
    );

    it('can mockup modules for test purpose', function(done) {
      var MMM = function() {};
      MMM.prototype.mockupMethod = function() {
        return 'faking behaviour';
      };

      Minjector.cache.MyMockedModule = MMM;

      define(['MyMockedModule'], function(MyMockedModule) {
        expect(typeof MyMockedModule).toBe('function');
        var mmm = new MyMockedModule();
        expect(mmm.mockupMethod()).toBe('faking behaviour');
        done();
      });
    });

  });

  // For the sake of overall goal of teh most trivial implementation as
  // possible, we dont implement/overwrite require().
  //
  // Because if you need Node.js require() for Node.js modules you cannot use
  // this module/file for the browser anyway!
  xdescribe('can handle AMD require', function() {

    // This is actually nonesense in browsers / asynchronous dependencies
    // resolution, to realize this we would have to wait for the first
    // dependency to be loaded to realize that the second one is inside
    // the first one. But we definitely want to start load all dependencies
    // immediately.
    // ... continue on next it(...).
    xit('and handle multiple mixed modules in same file', function(done) {
      define(['MixedModule', 'MixedId'], function(AnyModule, MixedModule) {
        expect(typeof AnyModule).toBe('object');
        expect(AnyModule.anonym2).toBe(2);

        expect(typeof MixedModule).toBe('object');
        expect(MixedModule.mixed).toBe('id');
        done();
      });
    });

    // However the second dependency might be a:
    // MixedModule = require('MixedId');
    // which is a synchronous call by definition of the AMD spec and just
    // will/has to fail if the dependency is not available synchronously.
    // However2 ... this feels dirty/unnecessary.
    it('and handle synchronous require() calls', function(done) {
      define(['MixedModule', 'MixedId'], function(AnyModule/*, MixedModule*/) {
        expect(typeof AnyModule).toBe('object');
        expect(AnyModule.anonym2).toBe(2);

        var MixedModule = Minjector.require('MixedId');

        expect(typeof MixedModule).toBe('object');
        expect(MixedModule.mixed).toBe('id');
        done();
      });
    });

    if (isNodeJs) {
      it('and falls back to node js native requier', function(done) {
        var fs = require('fs');
        fs.exists(__filename, function() {
          done();
        });
      });
    }
  });

});
