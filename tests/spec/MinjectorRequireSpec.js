describe('minjector implementation', function() {
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

    define.minjector.cache = {};

  });


  describe('can handle AMD local require', function() {
    it('and load modules asynchronous', function(done) {
      define(['require'], function(require) {
        expect(typeof require).toBe('function');

        require(['/RequiredModule'], function(RequiredModule) {
          expect(typeof RequiredModule).toBe('object');
          expect(RequiredModule.justRequired).toBe('AMD');
          done();
        });
      });
    });

    it('and require relative paths correctly', function(done) {
      define(['/require/RequireAbsolute'], function(RequireAbsolute) {
        RequireAbsolute.doRelRequire(function(value) {
          expect(value).toBe('12489357hmcranky');
          done();
        });
      });
    });

    it('inline define()\'s does not make any problems',
        function(done) {
          define(function() {
            define(['/inline/include', 'require'], function(inlineInclude, require) {
              expect(inlineInclude).toBe('inline_includeinlineinline_require');

              require(['./inline/req'], function(req) {
                expect(req).toBe('inline_require');
                done();
              });
            });
          });
        }
    );

    it('and multiple require() call dont overide anonym defined()' +
        ' modules',
        function(done) {
          define(['/req/Uniqueness', 'require'], function(Uniqueness, require) {
            expect(typeof Uniqueness).toBe('function');

            var u = new Uniqueness();
            expect(u.uniquee()).toBe('uniquee');

            var callback = function() {
              var uni = require('/req/Uniqueness');
              var un = new uni();
              expect(un.uniquee()).toBe('uniquee');
              done();
            };

            u.doRequireModule(callback);
          });
        }
    );

    // This is actually nonesense in browsers / asynchronous dependencies
    // resolution, to realize this we would have to wait for the first
    // dependency to be loaded to realize that the second one is inside
    // the first one. But we definitely want to start load all dependencies
    // immediately.
    // ... continue on next it(...).
    xit('and handle stupid dependency order', function(done) {
      define(['/MixedModule', '/MixedId'], function(MixedModule, MixedId) {
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
      define(['require', '/SyncRequireModule'], function(require, SRModule) {
        expect(typeof require).toBe('function');
        expect(typeof SRModule).toBe('object');

        var SR2Module = require('/CanBeRequiredSync');
        expect(typeof SR2Module).toBe('object');
        expect(SR2Module.iamSync).toBe('yes');
        done();
      });
    });
  });

});
