describe('minjector', function() {
  // ATTENTION:
  // This test spec is supposed to run in node AND browser.

  // TODO node-jasmine seams to execute only 1 describe() suite?

  var isNodeJs =
      typeof exports !== 'undefined' && this.exports !== exports;

  if (isNodeJs) {
    var config = require(process.cwd() + '/bootstrap.node.js');
    require(config.DIR.BIN + 'minjector');

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

    it('and handle multiple anonym modules in single file', function(done) {
      define(['OverwriteModule'], function(OverwriteModule) {
        expect(typeof OverwriteModule).toBe('object');
        expect(OverwriteModule.anonym2).toBe(2);
        done();
      });
    });

  });

  describe('can handle AMD local require', function() {
    it('and load modules asynchronous', function(done) {
      define(['require'], function(require) {
        expect(typeof require).toBe('function');

        require(['RequiredModule'], function(RequiredModule) {
          expect(typeof RequiredModule).toBe('object');
          expect(RequiredModule.justRequired).toBe('AMD');
          done();
        });
      });
    });

    // This is actually nonesense in browsers / asynchronous dependencies
    // resolution, to realize this we would have to wait for the first
    // dependency to be loaded to realize that the second one is inside
    // the first one. But we definitely want to start load all dependencies
    // immediately.
    // ... continue on next it(...).
    xit('and handle stupid dependency order (SKIPPED)', function(done) {
      define(['MixedModule', 'MixedId'], function(MixedModule, MixedId) {
        expect(typeof MixedModule).toBe('object');
        expect(MixedModule.anonym1).toBe(1);

        expect(typeof MixedId).toBe('object');
        expect(MixedId.mixed).toBe('id');
        done();
      });
    });

    // However the second dependency might be a:
    // var SR2Module = require('CanBeRequiredSync');
    // which is a synchronous call by definition of the AMD spec and just
    // will/has to fail if the dependency is not available synchronously.
    it('and handle synchronous require() calls', function(done) {
      define(['require', 'SyncRequireModule'], function(require, SRModule) {
        expect(typeof require).toBe('function');
        expect(typeof SRModule).toBe('object');

        var SR2Module = require('CanBeRequiredSync');
        expect(typeof SR2Module).toBe('object');
        expect(SR2Module.iamSync).toBe('yes');
        done();
      });
    });
  });

});
