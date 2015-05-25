describe('minjector error handling', function() {
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

  describe('handles errors', function() {
    it('from users inside a factory function', function(done) {
      spyOn(console, 'error').and.callFake(function(err) {
        expect(err).toEqual(jasmine.stringMatching('Error calling module factory function'));
        done();
      });

      define(['/errors/ErrorModule'], function() {});
    });

    it('of multiple anonym modules in single files',
        function(done) {
          spyOn(console, 'error').and.callFake(function(err) {
            expect(err).toEqual(jasmine.stringMatching('multiple anonym modules'));
            done();
          });
          define(['/errors/OverwriteModule'], function(OverwriteModule) {});
        }
    );

    it('of ambiguous module definitions',
        function(done) {
          spyOn(console, 'error').and.callFake(function(err) {
            expect(err).toEqual(jasmine.stringMatching('ambiguous'));
            done();
          });
          define(['/errors/Ambiguous'], function() {});
        }
    );
  });

});
