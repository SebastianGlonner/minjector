describe('minjector path resolution', function() {
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
        '/MapModule': {
          'getMapped2': '/mapped/recmap'
        },
        'LibMappedModules': {
          'MapToLibModule': 'MappedInLib'
        }
      }
    });
  });


  describe('can handle path normalization', function() {
    it('and normalize "./" correctly', function() {
      define.minjector.config({'baseUrl': '/a/b/'});
      expect(define.minjector.createPath(
          './d',
          {'id': './c', 'parent': null}
          )).toBe('/a/b/d');

      expect(define.minjector.createPath(
          './f/g',
          {'id': './c/d/e', 'parent': null}
          )).toBe('/a/b/c/d/f/g');
    });

    it('and normalize "../" correctly', function() {
      define.minjector.config({'baseUrl': '/a/b/'});
      expect(define.minjector.createPath(
          '../d',
          {'id': './c', 'parent': null}
          )).toBe('/a/d');

      expect(define.minjector.createPath(
          '../f/g',
          {'id': './c/d/e', 'parent': null}
          )).toBe('/a/b/c/f/g');

      expect(define.minjector.createPath(
          '../../f/g',
          {'id': './c/d/e', 'parent': null}
          )).toBe('/a/b/f/g');

      define.minjector.config({'baseUrl': '/a/b/c/d/'});
      expect(define.minjector.createPath(
          '../../f',
          {'id': 'e', 'parent': null}
          )).toBe('/a/b/f');
    });

    it('and handle starting "/" in path', function() {
      define.minjector.config({'baseUrl': '/a/b/'});
      expect(define.minjector.createPath(
          '/f/g',
          {'id': 'c/d/e', 'parent': null}
          )).toBe('/a/b/f/g');
    });

    it('and normalize parent path correctly', function() {
      var parent1 = {'id': './c/d'};
      var parent2 = {'id': './e/f/g'};
      var parent3 = {'id': './h'};

      parent3.parent = parent2;
      parent2.parent = parent1;

      define.minjector.config({'baseUrl': '/a/b/'});
      expect(define.minjector.createPath(
          './k',
          {'id': './i/j', 'parent': parent3}
          )).toBe('/a/b/c/e/f/i/k');
    });

    it('and normalize parent path correctly with interrupten', function() {
      var parent1 = {'id': './c/d'};
      var parent2 = {'id': './e/f/g'};
      var parent3 = {'id': '/h'};

      parent3.parent = parent2;
      parent2.parent = parent1;

      define.minjector.config({'baseUrl': '/a/b/'});
      expect(define.minjector.createPath(
          './k',
          {'id': './i/j', 'parent': parent3}
          )).toBe('/a/b/i/k');
    });

    it('do not cut /../ into nothing, allowing to use pahts above the' +
        'absolute root e.g. "./my/../../path" => "../path"',
        function() {
          expect(define.minjector.normalizePath(
              'a/b/',
              '../../../d',
              null
              )).toBe('../d');

          expect(define.minjector.normalizePath(
              '/a/b/',
              '../../../d',
              null
              )).toBe('/../d');

          expect(define.minjector.normalizePath(
              '/a/b/',
              '../../../c/d/../..',
              null
              )).toBe('/..');

          expect(define.minjector.normalizePath(
              '/a/b/',
              '../../../c/d/../../..',
              null
              )).toBe('/../..');
        }
    );

  });

  describe('can handle absolute and relative path resolution', function() {

    it('and load modules relative to current', function(done) {
      define(['/relative/IncludeRelative'], function(MyRelModule) {
        expect(typeof MyRelModule).toBe('function');
        var mmm = new MyRelModule();
        expect(mmm.isRelative()).toBe('isRelative_goingRelative');
        done();
      });
    });

    it('and load modules recursively relative to current', function(done) {
      define(['/relative/IncludeRelative2'], function(MyRelModule2) {
        expect(typeof MyRelModule2).toBe('function');
        var mmm = new MyRelModule2();
        expect(mmm.relative2()).toBe(
            'isRelative2_TrulyAbs1_TrulyRelative1_TrulyRelative2'
        );
        done();
      });
    });
  });

});
