describe('minjector building', function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

  var common = require('../../common.js');
  var fileParser = require(common.INCLUDE + 'fileParser.js');
  var build = require(common.INCLUDE + 'build.js');

  require(common.INCLUDE + 'minjector.js');

  Minjector.config({
    baseUrl: common.DIR.TESTS_DATA,
    libUrl: common.DIR.TESTS_DATA + 'lib/'
  });

  it('collect modules and dependencies of files', function(done) {
    fileParser('/building/MultiDependencies', Minjector)
      .then(function(parsedFile) {
          var modules = parsedFile.getModules();
          expect(Object.keys(modules).length).toBe(2);

          var mod1 = modules['/building/MultiDependencies'];
          var mod2 = modules['/building/Mod2'];
          expect(mod1).not.toBe(undefined);
          expect(mod2).not.toBe(undefined);

          var dep1 = mod1.getDependencies();
          var dep2 = mod2.getDependencies();
          expect(Object.keys(dep1).length).toBe(2);
          expect(Object.keys(dep2).length).toBe(2);

          expect(dep1['./Dep1']).not.toBe(undefined);
          expect(dep1['./Dep2']).not.toBe(undefined);

          expect(dep2['./Dep3']).not.toBe(undefined);
          expect(dep2['./Dep4']).not.toBe(undefined);
          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });

  it('collect dependencies recursively', function(done) {
    var moduleId = '/RecursiveModule';
    fileParser(moduleId, Minjector)
      .then(function(parsedFile) {
          var dependencies = parsedFile.getDependenciesRecursive(moduleId);

          // expect(modules[0].getId()).toBe('/RecursiveModule');
          expect(dependencies['/recursive/Recursive1']).not.toBe(undefined);
          expect(dependencies['/recursive/Recursive2']).not.toBe(undefined);
          expect(dependencies['/recursive/Recursive3']).not.toBe(undefined);
          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });

  it('collect dependencies recursively', function(done) {
    var moduleId = '/require/RequireAbsolute';
    fileParser(moduleId, Minjector)
      .then(function(parsedFile) {
          var dependencies = parsedFile.getDependenciesRecursive(moduleId);

          expect(Object.keys(dependencies).length).toBe(2);
          expect(dependencies['./nested/RequireRelModule']).not.toBe(undefined);
          expect(dependencies['./relative/Crank']).not.toBe(undefined);
          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });

  it('collect dependencies of inline elements\'s either', function(done) {
    var moduleId = '/building/InlineRequire';
    fileParser(moduleId, Minjector)
      .then(function(parsedFile) {
          var modules = parsedFile.getModules();
          expect(Object.keys(modules).length).toBe(1);

          var module = modules[moduleId];

          var dependencies = module.getDependencies();
          expect(Object.keys(dependencies).length).toBe(6);

          expect(dependencies['./Dep1']).not.toBe(undefined);
          expect(dependencies['./Dep2']).not.toBe(undefined);

          expect(dependencies['./nested/InlineDef1']).not.toBe(undefined);

          expect(dependencies['./InDep3']).not.toBe(undefined);
          expect(dependencies['./InDep4']).not.toBe(undefined);

          expect(dependencies['./RecInDep5']).not.toBe(undefined);

          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });

  it('can include with multiple parent relative ids.', function(done) {
    var moduleId = '/relative/IncludeRelative2';
    fileParser(moduleId, Minjector)
      .then(function(parsedFile) {
          var deps = parsedFile.getDependenciesRecursive(moduleId);
          expect(Object.keys(deps).length).toBe(3);

          expect(deps['./recursive/TrulyRelative1']).not.toBe(undefined);
          expect(deps['../TrulyRelative2']).not.toBe(undefined);

          expect(deps['./TrulyAbs1']).not.toBe(undefined);

          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });

  it('collect dependencies of specific modules only', function(done) {
    var moduleId = '/building/MultiDependencies';
    fileParser(moduleId, Minjector)
      .then(function(parsedFile) {
          var dependencies = parsedFile.getDependenciesRecursive(moduleId);
          expect(Object.keys(dependencies).length).toBe(2);

          expect(dependencies['./Dep1']).not.toBe(undefined);
          expect(dependencies['./Dep2']).not.toBe(undefined);

          expect(dependencies['./Dep3']).toBe(undefined);

          done();
        })
      .catch (function(e) {console.error(e.stack);});
  });


});
