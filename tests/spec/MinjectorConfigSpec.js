describe('minjector configuration', function() {
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

    define.config({
      map: {
        'WantMappedModules': {
          '/MapModule': '/mapped/mapit'
        },
        'WantMappedModules2': {
          '/MapModule2': '/mapped/mapit2'
        },
        '/MapModule': {
          'getMapped2': '/mapped/recmap'
        },
        'LibMappedModules': {
          'MapToLibModule': 'MappedInLib'
        }
      }
    });
  });

  describe('can handle a "libUrl"', function() {
    it('and correctly includes modules from lib', function(done) {
      define(['/lib/LibModule'], function(LibModule) {
        expect(typeof LibModule).toBe('object');
        expect(LibModule.libMethod()).toBe('yei');
        done();
      });
    });
  });

  describe('can handle a "map"', function() {
    it('and correctly mapping basic modules', function(done) {
      // This tests also that the module id remains and will not change
      // to the mapped name
      define('WantMappedModules', ['/MapModule'], function(MapModule) {
        expect(typeof MapModule).toBe('function');
        var obj = new MapModule();
        expect(obj.toString()).toBe('is_mapped_rec_mapped');
        done();
      });
    });

    it('and correctly mapping basic modules with "require" either', function(done) {
      // This tests also that the module id remains and will not change
      // to the mapped name
      define('WantMappedModules2', ['require'], function(require) {
        require(['/MapModule2'], function(MapModule) {
          expect(typeof MapModule).toBe('function');
          var obj = new MapModule();
          expect(obj.toString()).toBe('is_mapped_2rec_mapped');
          done();
        });
      });
    });

    it('and correctly mapping lib modules', function(done) {
      // This tests also that the module id remains and will not change
      // to the mapped name
      define('LibMappedModules', ['MapToLibModule'], function(MapModule) {
        expect(typeof MapModule).toBe('function');
        var obj = new MapModule();
        expect(obj.toString()).toBe('lib_mapped');
        done();
      });
    });
  });
});
