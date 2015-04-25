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
 * config: {
 *   // All modules which DOES start with '.' or '/'
 *   // will be searched relative to this base directory.
 *   // This modules path will be normalized and therefore can be relative
 *   // to this directory.
 *   // Defaults to: './'
 *   baseUrl: './some/dir'
 *
 *   // All modules which does NOT start with '.' or '/'
 *   // will be included by appending there path to this path.
 *   // This path does NOT get normalized.
 *   // Defaults to: './'
 *   libUrl: './some/other/dir'
 *
 *   // Mapp modules for modules to other modules.
 *   // For more details:
 *   // {@link https://github.com/amdjs/amdjs-api/wiki/Common-Config#map-}
 *   map: {
 *     'some/Module': {
 *       'map/this/module': 'to/this/module'
 *     }
 *   },
 *
 *   // Allow to set custom values for the global "define.amd" property.
 *   // This way you can use minjector in node environment without declaring
 *   // and explicit AMD environment.
 *   // This is required for e.g. punycode.js which is used by e.g. ws,
 *   // websocket_node etc.
 *   // Punycode.js would initialize itself as AMD module even so we are running
 *   // in node which results in errors in various modules which will load
 *   // this module as common node module. You can fix this issue be setting
 *   // define.config({globalAmdProperty: false})
 *   globalAmdProperty: {}
 * }
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



  /* global Promise */
  /* global window */
  /* global document */
  /* global GLOBAL */
  /* global require */
  /* global exports */
  /* global console */



(function(isNodeJs) {
  'use strict';


  /**
   * Constructor class.
   *
   * @param {object} cfg An optional configuration.
   * @constructor
   */
  var MinjectorClass = function(cfg) {

    this.cache = {};

    // This separated caching object is required for situations where
    // 2 modules in the same file (therefore running synchronous) require the
    // same module. With this object we save all required but not yet created
    // modules.
    this.isRequired = {};
    this.defineQueue = [];
    this.procWaiting = false;

    this.Bound = {};
    this.Bound.processDefineQueue = this.processDefineQueue.bind(this);

    this.cfg = {
      'baseUrl': './',
      'libUrl' : './',
      'map' : {}
    };

    if (cfg)
      this.config(cfg);
  };


  /**
   * Performance / Convenience.
   * @type {object}
   */
  var _proto = MinjectorClass.prototype;


  /**
   * Setting the config.
   * @param  {object} cfg
   * @this {Minjector}
   */
  _proto.config = function(cfg) {
    if (cfg.baseUrl)
      this.cfg.baseUrl = cfg.baseUrl;

    if (cfg.libUrl)
      this.cfg.libUrl = cfg.libUrl;

    if (cfg.map)
      this.cfg.map = cfg.map;

    if (typeof cfg.globalAmdProperty !== 'undefined')
      this.globalDefineReference.amd = cfg.globalAmdProperty;
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

    var module = this.initModule(id, dependencies, factory);

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
   * Initialize module object. Params @see this.define()
   * @param  {string}   id
   * @param  {array}    dependencies
   * @param  {function} factory
   * @return {object}
   */
  _proto.initModule = function(id, dependencies, factory) {
    return {
      id: id,
      dependencies: dependencies,
      factory: factory,
      ready: false,
      instance: null,
      listen: [],
      parent: null
    };
  };


  /**
   * Process all calls to define(...). This is necessary to support multiple
   * modules in a single file.
   *
   * @param {string} id
   * @param {object} parent The parent module of defined id.
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
      this.createModule(creatingQueue.pop());
    }
  };


  /**
   * Create the module by resolving all dependencies and executing
   * the factory function.
   *
   * @param  {object} module The object representing the module.
   * @param  {boolean} isRequire Was called from require([...], ...).
   * @return {object} The object representing the module.
   * @this {Minjector}
   */
  _proto.createModule = function(module, isRequire) {
    var dependencies = module.dependencies;

    var resolvedDependencies = [];
    var hasPromise = false;
    if (dependencies !== undefined) {
      var i, l, dependency, dependencyId;
      for (i = 0, l = dependencies.length; i < l; i++) {
        dependencyId = dependencies[i];

        if (dependencyId === 'require') {
          dependency = {
            ready: true,
            instance: function(mixed, callback) {
              return this.require(mixed, callback, module);
            }.bind(this)
          };
        } else {
          // The dependency might be already defined ...
          dependency = this.cache[dependencyId];
        }

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
    if (module.id && !isRequire)
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
          }.bind(this))
        .catch (function(e) {
            console.error(e.stack);
          });
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


  if (isNodeJs) {
    /**
     * Enviroment specific "require".
     * "Node.js" is using native "require" for inclucion.
     *
     * @param  {string} id Id of the dependency/module to require.
     * @param {object} parent The parent module of defined id.
     * @return {object|function} The factory result (created module).
     * @this {Minjector}
     */
    _proto.requireDependency = function(id, parent) {
      require(this.createPath(id, parent));

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
     * @param {object} parent The parent module of defined id.
     * @return {mixed} A Promise which will create the module.
     * @this {Minjector}
     */
    _proto.requireDependency = function(id, parent) {
      return new Promise(function(resolve, reject) {
        var scriptTag = document.createElement('script');
        scriptTag.src = this.createPath(id, parent) + '.js';
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
   * Create the path for an module by its id.
   *
   * @param  {string} id Id of the dependency/module to require.
   * @param {object} parent The parent module of defined id.
   * @return {string}
   * @this {Minjector}
   */
  _proto.createPath = function(id, parent) {
    // Check map config for module.
    var fc, path, mapping = this.cfg.map[parent.id];
    if (mapping && mapping[id])
      id = mapping[id];

    fc = id.charAt(0);
    if (fc === '.') {
      // We resolve parents only if we have relative module id
      path = this.resolveParents(parent);
      path += id;
      fc = path.charAt(0);

    } else {
      path = id;
    }

    // Is base or lib module
    var base = fc === '.' || fc === '/' ?
        this.cfg.baseUrl :
        this.cfg.libUrl;

    if (fc === '/')
      path = path.substr(1);

    return this.normalizePath(base, path);
  };


  /**
   * Resovle parent modules. Concatenate all ids of all parents
   * until no more parent exist or the id is not relative.
   * @param  {object} parent The parent module of the current module.
   * @return {string}
   * @this {Minjector}
   */
  _proto.resolveParents = function(parent) {
    var joined = '', isRel;
    while (parent) {
      var parentId = parent.id;
      if (!parentId)
        break;

      // Used mapped id if exists.
      if (parent.parent) {
        var mapping = this.cfg.map[parent.parent.id];
        if (mapping && mapping[parentId])
          parentId = mapping[parentId];
      }

      isRel = parentId.charAt(0) === '.';
      if (isRel)
        parentId = '/' + parentId;

      // Cut off the last part of the module id.
      parentId = parentId.substr(0, parentId.lastIndexOf('/') + 1);

      joined = parentId + joined;
      if (!isRel) {
        // Not relative, therefore break the parent path resolution since
        // we start from baseUrl in this case and do not care for any more
        // parents.
        break;
      }

      // "Pop stack" of the parent modules
      parent = parent.parent;
    }

    return joined.substr(0, joined.lastIndexOf('/') + 1);
  };


  /**
   * Normalize path. Resolve all ".." and ".".
   * @param  {string} base
   * @param  {string} path
   * @return {sting}
   *
   * @pure
   */
  _proto.normalizePath = function(base, path) {
    var pieces = base + path;
    var isStartingSlash = base.charAt(0) === '/';
    pieces = (isStartingSlash ? pieces.substr(1) : pieces).split('/');

    var res = [], piece, i, l, outside = 0;
    for (i = 0, l = pieces.length; i < l; i++) {
      piece = pieces[i];
      if (piece === '.' || piece === '') {

      } else if (piece === '..') {
        if (res.length > outside)
          res.pop();
        else {
          res.push(piece);
          outside++;
        }

      } else
        res.push(piece);
    }

    return (isStartingSlash ? '/' : '') + res.join('/');
  };


  if (isNodeJs) {
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
      window.setTimeout(callback, 0);
    };
  }


  /**
   * Local require implementation.
   * {@link https://github.com/amdjs/amdjs-api/wiki/require}
   * @param  {mixed}    mixed Id or array of dependencies.
   * @param  {function} callback
   * @param {object} parentModule The module in which this require gets called.
   * @return {mixed} The required module on synchronous call.
   * @this {Minjector}
   */
  _proto.require = function(mixed, callback, parentModule) {
    if (typeof mixed === 'string') {
      return this.cache[mixed].instance;

    } else if (Array.isArray(mixed)) {
      this.createModule.call(
          this,
          this.initModule(parentModule.id, mixed, callback),
          true
      );

    } else {
      throw new Error('Invalid arguments signature for require()');
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


  var global = isNodeJs ? GLOBAL : window;


  /**
   * Enviroment specific global instantiation.
   * @type {MinjectorClass}
   */
  var minjector = new MinjectorClass();


  var define = _proto.define.bind(minjector);
  define.minjector = minjector;
  define.config = minjector.config.bind(minjector);
  minjector.globalDefineReference = define;


  /**
   * Declaring amd environment. {@see this.cfg.globalAmdProperty}
   * @type {Object}
   */
  define.amd = {};


  /**
   * Set define as global function.
   * @type {function}
   */
  global.define = define;
})(
    typeof exports === 'object' &&
    typeof module === 'object' &&
    module.exports === exports
);
