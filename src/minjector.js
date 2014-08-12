/**
 * Minjector is an Asynchronous Module Definition (AMD) specification
 * implementation. It does not intent to be a complete
 * AMD implementation. There might be specifications we
 * are not interested in.
 *
 * However this piece of code is intended to be light weight (mobile first)
 * and run in "any" environment (browser, nodejs) (any does not fit
 * correctly since i do not support any browser ;) ).
 *
 * Known missing specifications implementations:
 * - loader plugins
 * - missing some configuration values (as it is "allowed" ;) )
 * - no global require (as it is "allowed" ;) )
 *
 * Global definitions:
 *   // Define function
 *   {function} define(id, dependencies, factory)
 *
 *   // Default instantiation of this implemenation.
 *   {object} Minjector
 *
 * @author info@efesus.de (Sebastian Glonner)
 */



/**
 * Constructor class.
 *
 * config: {
 *   // All modules will be searched relative to this base directory.
 *   baseUrl: './some/dir'
 * }
 *
 * @param {object} cfg A configuration.
 * @constructor
 */
var MinjectorClass = function(cfg) {
  this.config(cfg);

  this.cache = {};

  // Add local require
  this.mockModule('require', this.require.bind(this));

  // This separated caching object is required for situations where
  // 2 modules in the same file (therefore running synchronous) require the
  // same module. With this object we save all required but not yet created
  // modules.
  this.isRequired = {};
  this.defineQueue = [];
  this.procWaiting = false;

  this.Bound = {};
  this.Bound.processDefineQueue = this.processDefineQueue.bind(this);
};


/**
 * Performance / Convenience.
 * @type {object}
 */
var _proto = MinjectorClass.prototype;


/**
 * Detecting if we are running in node!
 * @type {Boolean}
 */
_proto.isNodeJs =
    typeof exports !== 'undefined' && this.exports !== exports;


/**
 * Setting the config.
 * @param  {object} cfg
 * @this {Minjector}
 */
_proto.config = function(cfg) {
  this.cfg = {'baseUrl': './'};

  if (typeof cfg !== 'object')
    return;

  for (var i in cfg) {
    if (!cfg.hasOwnProperty(i))
      continue;

    this.cfg[i] = cfg[i];
  }
};


/**
 * Implementation of the global define function.
 * @param  {string} id
 * @param  {array} dependencies
 * @param  {function} factory
 * @this {Minjector}
 */
_proto.define = function(id, dependencies, factory) {
  var argLength = arguments.length;
  if (argLength === 1) {
    factory = id;
    dependencies = undefined;
    id = undefined;
  } if (argLength === 2) {
    factory = dependencies;

    if (Array.isArray(id)) {
      dependencies = id;
      id = undefined;

    } else
      dependencies = undefined;
  }

  if (typeof factory !== 'function')
    throw new Error('Require module factory function: ' + id);

  if (id && this.cache[id]) {
    throw new Error('Found ambiguous module: ' + id);
  }

  var module = {
    id: id,
    dependencies: dependencies,
    factory: factory,
    ready: false,
    instance: null,
    listen: [],
    parent: null
  };

  if (id)
    this.cache[id] = module;

  this.defineQueue.push(module);

  // This is necessary for the "entry point"! Somewhere you have to start
  // using define() and this very first call would just not process.
  // However all included dependencies will call .processDefineQueue on their
  // own after including the appropriate file.
  if (this.procWaiting)
    return;

  this.procWaiting = true;
  this.onNextTick(this.Bound.processDefineQueue);
};


/**
 * Process all calls to define(...). This is necessary to support multiple
 * modules in a single file.
 *
 * @param {string} id
 * @this {Minjector}
 */
_proto.processDefineQueue = function(id, parent) {
  this.procWaiting = false;
  var queue = this.defineQueue;
  if (queue.length === 0)
    return;

  // On purpose: Process all define() calls...
  var module, creatingQueue = [];
  while (queue.length) {
    module = queue.pop();

    module.parent = parent;

    if (!module.id)
      module.id = id;

    creatingQueue.push(module);
  }

  // and then start creating the modules which has been defined.
  // Because we need to know which modules are in the
  // current file before starting creating them.
  while (creatingQueue.length) {
    module = creatingQueue.pop();

    creationResult = this.createModule(module);
  }
};


/**
 * Create the module by resolving all dependencies and executing
 * the factory function.
 *
 * @param  {object} module The object representing the module.
 * @return {object} The object representing the module.
 * @this {Minjector}
 */
_proto.createModule = function(module) {
  var dependencies = module.dependencies;

  var resolvedDependencies = [];
  var hasPromise = false;
  if (dependencies !== undefined) {
    var i, l, dependency, dependencyId;
    for (i = 0, l = dependencies.length; i < l; i++) {
      dependencyId = dependencies[i];

      // The dependency might be already defined ...
      dependency = this.cache[dependencyId];
      if (!dependency) {
        hasPromise = true;
        // ... or is already required and in loading state.
        dependency = this.isRequired[dependencyId];

        if (!dependency) {
          dependency = this.requireDependency(dependencyId, module);

          if (dependency instanceof Promise) {
            // We need to save the Promise which will create this module some
            // how. Cause there might come more modules which depends on this
            // one but have to wait before it is loaded as well. In this case
            // we dont want to include it again or create a second Promise, but
            // reuse the existing one.
            this.isRequired[dependencyId] = dependency;
          } else {
            // Since Node.js might be cabable of requiring synchronous
            // without the need of a Promise.
            hasPromise = false;
          }

        }

      } else if (!dependency.ready) {
        hasPromise = true;
        dependency = this.listenOnCreation(dependency);
      } else {
        dependency = dependency.instance;
      }

      resolvedDependencies.push(dependency);
    }
  }

  // Add this module to the cache now! So that other modules know that this
  // dependency is in progress of loading / creating.
  this.cache[module.id] = module;

  if (!hasPromise) {
    // This should be a performance win since we do not create an extra
    // Promise which resolves immediately.
    this.callFactoryCallback(
        module,
        resolvedDependencies
    );
  } else {
    // Create Promise resolving if all dependencies are resolved.
    module.instance = Promise.all(resolvedDependencies)
      .then(function(resolvedDependencies) {
          var _module = module;
          return this.callFactoryCallback(
              _module,
              resolvedDependencies
          );
        }.bind(this));
  }

  return module;
};


/**
 * Execute the module factory function and set the cached module to ready state.
 *
 * @param  {object} module The object representing the module.
 * @param  {array} resolvedDependencies
 * @return {mixed} The module object containing creating the executed instance.
 * @this {Minjector}
 */
_proto.callFactoryCallback = function(module, resolvedDependencies) {
  module.instance = module.factory.apply(null, resolvedDependencies);
  module.ready = true;
  delete this.isRequired[module.id];

  var i, l;
  for (i = 0, l = module.listen.length; i < l; i++) {
    module.listen[i](module.instance);
  }

  delete module.listen;
  return module;
};


/**
 * Returning a Promise which is listening for the module creation event.
 * By means of resolving on this very event.
 * @param  {object} module The object representing the module.
 * @return {Promise}
 */
_proto.listenOnCreation = function(module) {
  return new Promise(function(resolve, reject) {
    module.listen.push(function(moduleInstance) {
      resolve(moduleInstance);
    });
  });
};


if (_proto.isNodeJs) {
  /**
   * Enviroment specific "require".
   * "Node.js" is using native "require" for inclucion.
   *
   * @param  {string} id Id of the dependency/module to require.
   * @return {object|function} The factory result (created module).
   * @this {Minjector}
   */
  _proto.requireDependency = function(id, parent) {

    require(this.normalizePath(
        this.cfg.baseUrl,
        id,
        parent
    ));

    this.processDefineQueue(id, parent);

    var resolvedModule = this.cache[id];
    if (!resolvedModule.ready) {
      // The module is not ready but we have to return something
      // due to Node.js synchronous execution. Therefore return a Promise
      // resolving after creation, which lets the "parent" module wait either.
      return new Promise(function(resolve, reject) {
        resolvedModule.listen.push(function(moduleInstance) {
          resolve(moduleInstance);
        });
      });
    }

    return resolvedModule.instance;
  };

} else {
  /**
   * Performance issue. Access document only once and save reference.
   * @type {Element}
   */
  _proto.domDocumentHead = document.head;


  /**
   * Enviroment specific "require".
   * "DOM" implementation.
   *
   * @param  {string} id Id of the dependency/module to require.
   * @return {mixed} A Promise which will create the module.
   * @this {Minjector}
   */
  _proto.requireDependency = function(id, parent) {
    return new Promise(function(resolve, reject) {
      var scriptTag = document.createElement('script');
      scriptTag.src = this.normalizePath(
          this.cfg.baseUrl,
          id,
          parent
      ) + '.js';
      scriptTag.type = 'text/javascript';
      scriptTag.charset = 'utf-8';
      scriptTag._moduleId = id;

      scriptTag.addEventListener('load', function(event) {
        var moduleId = event.target._moduleId;

        // Define was called from the loaded script.
        // This event and the execution of the loaded script
        // happens synchronous (Immediately after execution of the loaded
        // script).
        // Therefore this.defineQueue holds now all the in this
        // loaded script executed define()'s and we want to process them now.

        // Kind of tricky here. This might return the Promise from
        // @see this.createModule() which resolves if all dependencies of
        // this module are reseolved. Then and only then we can create
        // and resolve this module as well. This closes the recursive
        // "Promise / async loading" chain
        this.processDefineQueue(moduleId, parent);
        var resolvedModule = this.cache[moduleId];

        if (!resolvedModule.ready) {
          // Since the module is defined but not ready, resolve on
          // creation event.
          resolvedModule.listen.push(function(moduleInstance) {
            resolve(moduleInstance);
          });

        } else {
          resolve(resolvedModule.instance);
        }
      }.bind(this), false);

      this.domDocumentHead.appendChild(scriptTag);
    }.bind(this));
  };
}


/**
 * Normalize a module path. Add all parent modules
 * in relative cases (path starting with './' or '../').
 * @param  {string} base   The config.baseUrl.
 * @param  {string} path   The path/id of the current module.
 * @param  {object} parent The parent module of the current module.
 * @return {string}
 * @this {Minjector}
 *
 * @pure
 */
_proto.normalizePath = function(base, path, parent) {
  // Add the current module path to the parent stack for
  // general path handling issues.
  parent = {
    id: path,
    parent: parent
  };

  var parentResolution = '', first = true;
  while (parent) {
    var parentId = parent.id;
    if (!parentId)
      break;

    // Strip starting slahes.
    if (parentId.charAt(0) === '/')
      parentId = parentId.substr(1);

    // Strip trailing slahes.
    if (parentId.charAt(parentId.length - 1) === '/')
      parentId = parentId.substr(0, parentId.length - 1);

    // We don't want to cut of the module name of the current module!
    if (first !== true) {

      // Specification says:
      // '/a/b/c' + './d/e' = '/a/b/d/e'
      // '/a/b/c' + '../d/e' = '/a/d/e'
      // Therefore in both cases we need to cut off the actual module name
      // '/a/b/c' => '/a/b'
      // '/e' => ''
      parentId = parentId.substr(0, parentId.lastIndexOf('/') + 1);
    }

    first = false;

    parentResolution = parentId + parentResolution;
    if (parentId.charAt(0) !== '.') {
      // Not relative, therefore break the parent path resolution since
      // we start from baseUrl in this case and do not care for any more
      // parents.
      break;
    }

    // "Pop stack" of the parent modules
    parent = parent.parent;
  }

  var pieces = (base + parentResolution).split('/');

  var res = [], piece, i, l;
  for (i = 0, l = pieces.length; i < l; i++) {
    piece = pieces[i];
    if (piece === '.') {

    } else if (piece === '..') {
      res.pop();
    } else
      res.push(piece);
  }
  return res.join('/');
};


if (_proto.isNodeJs) {
  /**
   * Process callback on next tick.
   * @param  {Function} callback
   */
  _proto.onNextTick = function(callback) {
    process.nextTick(callback);
  };
} else {
  /**
   * Process callback on next tick.
   * @param  {Function} callback
   */
  _proto.onNextTick = function(callback) {
    setTimeout(callback, 0);
  };
}


/**
 * Local require implementation.
 * @param  {mixed}    id
 * @param  {function} callback
 * @return {mixed} The required module on synchronous call.
 * @this {Minjector}
 */
_proto.require = function(id, callback) {
  if (typeof id === 'string') {
    return this.cache[id].instance;
  } else {
    define.call(this, id, callback);
  }
};


/**
 * Add instantiated module in ready state to the cache.
 * @param  {string} id       Module id.
 * @param  {mixed} instance The result of the modules factory function.
 * @this {Minjector}
 */
_proto.mockModule = function(id, instance) {
  this.cache[id] = {
    ready: true,
    instance: instance
  };
};


var global;
if (_proto.isNodeJs) {
  global = GLOBAL;

  /**
   * Enviroment specific global instantiation.
   * @type {MinjectorClass}
   */
  global.Minjector = new MinjectorClass({base: process.cwd()});
} else {
  global = window;

  /**
   * Enviroment specific global instantiation.
   * @type {MinjectorClass}
   */
  global.Minjector = new MinjectorClass({base: './'});
}


/**
 * Set define as global function.
 * @type {function}
 */
global.define = _proto.define.bind(global.Minjector);


/**
 * Declaring amd environment.
 * @type {Object}
 */
global.define.amd = {};
