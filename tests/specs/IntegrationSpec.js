describe('minjector building intregration', function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

  var itTitle;
  var common = require('../../common.js');
  var fileParser = require(common.INCLUDE + 'fileParser.js');
  var build = require(common.INCLUDE + 'build.js');

  require(common.INCLUDE + 'minjector.js');

  Minjector.config({
    baseUrl: common.DIR.TESTS_DATA + 'building/process/',
    libUrl: common.DIR.TESTS_DATA + 'building/process/lib/'
  });

  var buildConfig = {
    'destination': common.DIR.TESTS_DATA + 'building/process/result/',
    'files': [
      {
        'id': './app',
        'files': [
          'modules/module1',
          {
            'id': 'modules/module2'
          }
        ]
      }
    ],
    'encoding': 'utf8'
  };

  build(buildConfig, Minjector);

  xdescribe('supports the ATF pattern', function() {

    it('support multiple hierarchy main files', function(done) {
      // build result in app.js contain -> lib1, lib2, lib5, and the
      //  init code
      //
      // module1.js contain -> lib3
      //
      // module2.js contain -> lib3, lib4
    });

    itTitle = 'notify if multiple entry files require the same dependencies';
    it(itTitle, function(done) {
      // lib3 is required from module1 and module2 -> notify
    });

    itTitle = 'sub main files does not include parent dependencies';
    it(itTitle, function(done) {
      // sub main files module1 and module2 does not contain lib1
    });

  });

  return;

  it('notify any dynamic id / dependency definition', function(done) {
    // get notification for app.js dynamic inline require.
  });

  xdescribe('support result tracking for faster rebuilding', function() {
    itTitle = 'creates minjector.build.json file containing all modules' +
        'with its position inside the result file';
    it(itTitle, function(done) {

    });

    it('track warnings and to not notify on rebuilding', function(done) {

    });
  });

  itTitle = 'notify any non whitespace code outside of define elements';
  it(itTitle, function(done) {
    // lib2 -> notification for lost code
  });

  itTitle = 'do not notify non whitespace code outside of define elements' +
      ' for main files';
  it(itTitle, function(done) {
    // lib3 -> no notification for comments
  });

  itTitle = 'supports chrome source maps';
  it(itTitle, function(done) {
    // lib3 -> no notification for comments
  });
});
