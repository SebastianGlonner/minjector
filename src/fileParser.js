var fs = require('fs');
var parser = require('./parser');


/**
 * Representing a parsed file. Holding references to all modules and there
 * dependencies with the corresponding files.
 * The dependencies get resolved recursivly.
 * Each file corresponds to at least one module with an id.
 *
 * Constructor is private. Use factory method {@see createParsedFile}
 *
 * @param {string} id Module id.
 * @param {string} file File path.
 * @param {string} parsedCode
 * @param {Minjector} minjector
 * @this {CodeProperties}
 */
var ParsedFile = function(id, file, parsedCode, minjector) {
  this.id = id;
  this.file = file;
  this.parsedCode = parsedCode;
  this.minjector = minjector;
  this.modules = {};
};


/**
 * Prototype shortcut.
 * @type {object}
 */
var _pt = ParsedFile.prototype;


/**
 * Get this module id corresponding to this file path.
 * @return {string}
 * @this {ParsedFile}
 */
_pt.getId = function() {
  return this.id;
};


/**
 * Returns an array of modules of type {Module}. NOTE: These are
 * define's only at top level. No inline and no require elements.
 * @return {array}
 * @this {ParsedFile}
 */
_pt.getModules = function() {
  return this.modules;
};


/**
 * Recursively receive all dependencies of the given module. These
 * dependencies can spread over multiple files.
 *
 * @param  {string} moduleId
 * @return {object} {[dependencyId]: [Dependency]} like object.
 * @this {ParsedFile}
 */
_pt.getDependenciesRecursive = function(moduleId) {
  var module = this.modules[moduleId];
  if (!module)
    throw new Error('Unknown module: ' + moduleId);

  var stack = [module];
  var result = {};

  while (stack.length > 0) {
    module = stack.pop();

    var id, dependencies = module.getDependencies();

    for (id in dependencies) {
      if (!dependencies.hasOwnProperty(id))
        continue;

      dependencyModule = dependencies[id].getRemoteModule();
      result[id] = dependencies[id];

      stack.push(dependencyModule);
    }

  }

  return result;
};


/**
 * Return the absolute file path.
 * @return {string}
 * @this {ParsedFile}
 */
_pt.getFile = function() {
  return this.file;
};


/**
 * Return the {ParsedCode} object of the contents of this file.
 * @return {ParsedCode}
 * @this {ParsedFile}
 */
_pt.getParsedCode = function() {
  return this.parsedCode;
};


/**
 * Initialize and create this files {@see this.modules}.
 * Private method gets called during ParsedFile creation and should never be
 * called again.
 *
 * @param  {Dependency} parent
 * @this {ParsedFile}
 */
_pt.initElements = function(parent) {
  var defines = this.parsedCode.getDefines();
  var i, l, define, id,
      module;
  for (i = 0, l = defines.length; i < l; i++) {
    define = defines[i];

    id = define.getId().getValue();
    if (!id) {
      id = this.getId();
    }

    module = new Module(define, id, parent);

    module.setDependencies(this.initElementDependencies(
        define,
        module));

    this.modules[id] = module;
  }
};


/**
 * Initialize all dependencies of a module. Including all inline dependencies.
 * Meaning inline define's or require's inside this module.
 *
 * @param  {MinjectorElement} element The element to init the dependencies of.
 * @param  {Module} module  The module will be set as module of the dependency.
 * @return {object} {[dependencyId]: [Dependency]} like object.
 * @this {ParsedFile}
 */
_pt.initElementDependencies = function(element, module) {
  var objDependencies = {}, dependencies, dependencyId, children, i, l;
  var stack = [element];
  while (stack.length > 0) {
    element = stack.pop();

    dependencies = element.getDependencies();
    if (dependencies !== null) {
      dependencies = dependencies.getValue();
      for (i = 0, l = dependencies.length; i < l; i++) {
        dependencyId = dependencies[i];

        if (dependencyId === 'require')
          continue;

        objDependencies[dependencyId] = new Dependency(dependencyId, module);
      }
    }

    children = element.getChildren();
    for (i = 0, l = children.length; i < l; i++) {

      stack.push(children[i]);
    }
  }

  return objDependencies;
};


/**
 * Resolve all modules and their dependencies. Parse and create references
 * to the appropriate files of each dependencies of these modules.
 * Private method which will be called during {@see createParsedFile}.
 *
 * @return {Promise} Promise resolves after all files got read and parsed.
 * @this {ParsedFile}
 */
_pt.resolveDependencies = function() {
  var dependencyFilesHandler = new DependencyFilesHandler();

  var module, id, modules = this.modules;
  var dependencyId, dependencies;
  for (id in modules) {
    if (!modules.hasOwnProperty(id))
      continue;

    module = modules[id];
    dependencies = module.getDependencies();

    for (dependencyId in dependencies) {
      if (!dependencies.hasOwnProperty(dependencyId))
        continue;

      dependencyFilesHandler.add(
          dependencies[dependencyId],
          this.minjector
      );
    }
  }

  return dependencyFilesHandler.readAndParse();
};


/**
 * Representing a module inside this file.
 *
 * @param {MinjectorElement} element The MinjectorElement of this module.
 * @param {string} id The id of this module.
 * @param {Module} parent The parent module.
 * @this {Module}
 */
var Module = function(element, id, parent) {
  this.element = element;
  this.id = id;
  this.dependencies = null;
  this.parent = parent || null;
};


/**
 * Return this module id
 * @return {string}
 */
Module.prototype.getId = function() {
  return this.id;
};


/**
 * Return the parent module.
 * @return {Module}
 */
Module.prototype.getParent = function() {
  return this.parent;
};


/**
 * Set this module dependencies.
 * @param {object} deps
 */
Module.prototype.setDependencies = function(deps) {
  this.dependencies = deps;
};


/**
 * Get modules dependencies.
 * @return {object}
 */
Module.prototype.getDependencies = function() {
  return this.dependencies;
};


/**
 * Return the code of this elements.
 * @return {string}
 */
Module.prototype.getCode = function() {
  return this.element.getCode(this.getId());
};


/**
 * Representing a dependency of a module. This dependency has a module
 * which is the module which this dependency corresponds to.
 * In addition to this the dependency id refers to another module. The
 * remote module which in most cases lives in another parsed file.
 *
 * @param {string} id     Dependency id.
 * @param {Module} module The module this dependency corresponds to.
 * @this {Dependency}
 */
var Dependency = function(id, module) {
  this.id = id;
  this.parsedFile = null;
  this.module = module;
};


/**
 * Return this dependency id.
 * @return {string}
 */
Dependency.prototype.getId = function() {
  return this.id;
};


/**
 * Return the parsed file this dependencies remote module is in.
 * @return {ParsedFile}
 */
Dependency.prototype.getParsedFile = function() {
  return this.parsedFile;
};


/**
 * Set the parsed file this dependency remote module lives in.
 * @param {ParsedFile} parsedFile
 */
Dependency.prototype.setParsedFile = function(parsedFile) {
  this.parsedFile = parsedFile;
};


/**
 * Get the remote module defined in the remote parsed file this dependency id
 * corresponds to.
 * @return {Module}
 */
Dependency.prototype.getRemoteModule = function() {
  return this.parsedFile.getModules()[this.id];
};


/**
 * Get the module this dependency is part of.
 * @return {Module}
 */
Dependency.prototype.getModule = function() {
  return this.module;
};


/**
 * Create a recursive object structure of all parent modules of this
 * dependencies module, required for {@see Minjector.createPath}. Example:
 * {
 *   id: 'AnyId',
 *   parent: {
 *     id: 'AnyParent'
 *     parent: {
 *       id: 'MoreParents',
 *       parent: null
 *     }
 *   }
 * }
 * @return {object}
 */
Dependency.prototype.resolveParentsToObject = function() {
  var result = {parent: null};
  var first = result;
  var modules = [];
  var parent = this.getModule();

  while (parent) {
    result.parent = {
      id: parent.getId(),
      parent: null
    };

    parent = parent.getParent();
    result = result.parent;
  }
  return first.parent;
};


/**
 * Helper class to read and parse files of dependencies and associating these
 * relations. Handling the possible multiple relations where more dependencies
 * might live in the same file.
 *
 * @this {DependencyFilesHandler}
 */
var DependencyFilesHandler = function() {
  this.promises = [];
  this.files = {};
  this.filesById = {};
  this.dependencies = [];
};


/**
 * Add a dependency to resolve.
 *
 * @param {Dependency} dependency
 * @param {Minjector} minjector
 */
DependencyFilesHandler.prototype.add = function(dependency, minjector) {
  var dependencyId = dependency.getId();

  var parents = dependency.resolveParentsToObject();
  var file = minjector.createPath(dependencyId, parents) + '.js';

  if (this.files[file] === undefined) {
    var promise = createParsedFile(
        dependencyId,
        minjector,
        dependency.getModule(),
        file);

    this.files[file] = promise;
    this.promises.push(promise);
  }

  this.dependencies.push(dependency);
  this.filesById[dependencyId] = file;
};


/**
 * Read and parse all files of all added dependencies.
 * @return {Promise} Resolving when ready.
 */
DependencyFilesHandler.prototype.readAndParse = function() {
  return Promise.all(this.promises)
    .then(function(parsedFiles) {
        this.applyParsedFiles(parsedFiles);
        this.associateFiles2Dependencies();

      }.bind(this))
    .catch (function(e) {console.error(e.stack);});
};


/**
 * Retrieve the parsed file for a specific dependency id.
 * @param  {string} id Dependency id.
 * @return {ParsedFile}
 */
DependencyFilesHandler.prototype.getFileById = function(id) {
  return this.files[this.filesById[id]];
};


/**
 * Apply the parsed files by their file paths for later querying.
 *
 * @param  {array} parsedFiles
 */
DependencyFilesHandler.prototype.applyParsedFiles = function(parsedFiles) {
  var i, l, parsedFile;
  for (i = 0, l = parsedFiles.length; i < l; i++) {
    parsedFile = parsedFiles[i];
    this.files[parsedFile.getFile()] = parsedFile;
  }
};


/**
 * Associate the resolved parsed files to their corresponding dependencies.
 *
 */
DependencyFilesHandler.prototype.associateFiles2Dependencies = function() {
  var i, l, dependency, dependencies = this.dependencies;
  for (i = 0, l = dependencies.length; i < l; i++) {
    dependency = dependencies[i];

    dependency.setParsedFile(
        this.getFileById(dependency.getId())
    );
  }
};


/**
 * Factory method to create a parsed file. Initializing and resolving
 * all modules and dependencies of this file.
 *
 * @param  {string} id        Module id corresponding to the file path.
 * @param  {Minjector} minjector
 * @param  {Module} parent The parent module of this.
 * @param  {string} file      File path corresponding to the module id.
 * @return {Promise} Resolving to {ParsedFile}
 */
var createParsedFile = function(id, minjector, parent, file) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, {'encoding': 'utf8'}, function(err, data) {
      if (err) {
        throw err;
      }

      var parsedFile = new ParsedFile(
          id,
          file,
          parser.parse(data),
          minjector);

      parsedFile.initElements(parent);

      parsedFile
        .resolveDependencies()
        .then(function() {
            resolve(parsedFile);
          })
        .catch (function(e) {console.error(e.stack);});
    });
  });
};


/**
 * Create parsed file for a given module id.
 * @param  {string} id        Module id.
 * @param  {Minjector} minjector Minjector instance required for module
 * id resolution by configuration.
 * @return {Promise}
 */
var createParsedFileFromModule = function(id, minjector) {
  return createParsedFile(
      id,
      minjector,
      null,
      minjector.createPath(id, {id: null}) + '.js'
  );
};


/**
 * @type {function}
 */
module.exports = createParsedFileFromModule;
