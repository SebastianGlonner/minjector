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
 * No use of "eval".
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


  if (typeof console.error !== 'function')
    console.error = console.log.bind(console);


  /**
   * A module.
   *
   * @param {string} id
   * @param {array} dependencies
   * @param {function} factory
   */
  var Module = function(id, dependencies, factory) {
    this.id = id;
    this.path = undefined;
    this.dependencies = dependencies;
    this.resolvedDependencies = undefined;
    this.factory = factory;
    this.instance = undefined;
    this.parent = undefined;
    this.listen = [];
    this.loading = undefined;
    this.predefined = false;
  };

  /**
   * Returning the instance or an promise which will resolve to the instance
   * of this module.
   *
   * @return {mixed}
   */
  Module.prototype.resolveToInstance = function() {
    if (this.instance !== undefined)
      return this.instance;

    if (this.loading)
      return this.loading;

    return this.listenOnCreation();
  };

  /**
   * Add listener for the module instance creation event.
   */
  Module.prototype.listenOnCreation = function() {
    return new Promise(function(resolve, reject) {
      this.listen.push(function(moduleInstance) {
        resolve(moduleInstance);
      });
    }.bind(this));
  };

  /**
   * Fire instance creation event for this module.
   */
  Module.prototype.fireOnCreation = function() {
    var listen = this.listen, instance = this.instance;
    for (var i = 0, l = listen.length; i < l; i++) {
      listen[i](instance);
    }
  };


  /**
   * Constructor class.
   *
   * @param {object} cfg An optional configuration.
   * @constructor
   */
  var MinjectorClass = function(cfg) {
    this.cache = {};
    this.defineQueue = [];

    this.boundProcessDefineQueue = this.processDefineQueue.bind(this);

    this.cfg = {
      'baseUrl': './',
      'libUrl' : './',
      'map' : {}
    };

    if (cfg)
      this.config(cfg);
  };


  /**
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

    this.defineQueue.push([id, dependencies, factory]);

    // This is necessary for the "entry point". Somewhere you have to start
    // using define() and this very first call would just not process.
    // However all required dependencies will call .processDefineQueue on their
    // own after including the appropriate file.
    this.onNextTick(this.boundProcessDefineQueue);
  };


  /**
   * Process all calls to define(...). Means after this call all the modules
   * are defined and in the cache but not neccesarily loaded/instantiated.
   *
   * @param {string} dependencyId
   * @param {Module} parent The parent module of the currentyl queued define's.
   * @this {Minjector}
   */
  _proto.processDefineQueue = function(dependencyId, parent) {
    var queue = this.defineQueue;
    if (queue.length === 0)
      return;

    // On purpose: Process all define() calls ...
    var args, id, creatingQueue = [], anonym = 0, ambiguous;
    while (queue.length) {
      args = queue.pop();
      id = args[0];

      // If we included a anonym module, now is the time to set
      // the id of this module, which is then its path / "include id".
      if (!id) {
        id = dependencyId;
        anonym++;
      } else {
        ambiguous = this.cache[this.createPath(id, parent)];
        if (ambiguous && ambiguous.predefined !== true) {
          console.error('Found ambiguous module: ' + id);
          continue;
        }
      }

      creatingQueue.push(this.defineModule(id, args[1], args[2], parent));
    }

    if (anonym > 1) {
      console.error('InvalidSyntaxException: Found multiple anonym ' +
          'modules in: ' + id);
    }

    // ... and then start creating the modules which has been defined.
    // Because we need to know which modules are in the
    // current file before starting creating them (supporting independent
    // module order in one file)
    while (creatingQueue.length) {
      this.createModule(creatingQueue.pop());
    }
  };


  /**
   * Define a module. Means adding it to the cache and or setting various
   * properties.
   *
   * @param  {string} id
   * @param  {array} dependencies
   * @param  {function} factory
   * @param  {Module} parent The parent module of this one.
   * @return {Module}
   *
   * @this {Minjector}
   */
  _proto.defineModule = function(id, dependencies, factory, parent) {
    var path, module, cached, fromCache = false;
    // Just writing "define(function() {});" is valid. However if this anonym
    // module wont get included as dependency (and therefore receiving an id)
    // the factory function should be executed without saving it to the cache.
    // This might be the case for the very first entry point which can be this
    // or an "require()" call.
    if (id) {
      path = this.createPath(id, parent);
      module = this.cache[path];
    }

    if (!module)
      module = new Module(id, dependencies, factory);
    else {
      // If the module is already defined during dependency resolution then
      // we do not have any other information than the dependenyId.
      // Therefore set this value now.
      module.dependencies = dependencies;
      module.factory = factory;
      module.predefined = false;
      fromCache = true;
    }

    if (path) {
      if ( fromCache !== true ) {
        // Prevent object lookup if module is already in the cache.
        this.cache[path] = module;
      }

      module.path = path;
    }

    module.parent = parent;
    return module;
  };


  /**
   * Create the module by resolving all dependencies and executing
   * the factory function then.
   *
   * @param  {string} id
   * @param  {array} dependencies
   * @param  {function} factory
   * @param  {object} parent The object representing parent module of this one.
   *
   * @this {Minjector}
   */
  _proto.createModule = function(module) {
    var loading = module.dependencies ?
      this.createDependencies(module) :
      Promise.resolve();

    module.loading = loading.then(function(resolvedDependencies) {
      module.resolvedDependencies = resolvedDependencies;
      return this.callFactory(module);
    }.bind(this));
  };


  /**
   * Resolve all of this modules dependencies. Returning Promise resolving to
   * these instantiated dependencies.
   *
   * @param  {Module} module
   * @return {Promise}
   */
  _proto.createDependencies = function(module) {
    var dependencies = module.dependencies;

    var resolvedDependencies = [],
      i, l, dependency, dependencyId, dependencyPath, dependencyModule;
    if (dependencies !== undefined) {
      for (i = 0, l = dependencies.length; i < l; i++) {
        dependencyId = dependencies[i];

        // Special treatment for the inline "require" AMD specification.
        if (dependencyId === 'require') {
          resolvedDependencies.push(function(mixed, callback) {
            // Need to create this function here cause we need the parent
            // module as closure.
            return this.require(mixed, callback, module);
          }.bind(this));

          continue;
        }

        // The dependency might be already defined ...
        dependencyPath = this.createPath(dependencyId, module);
        dependency = this.cache[dependencyPath];

        if (!dependency) {
          // Save the dependency to the cache as predefined so that all
          // comming modules know this dependency is known and in process of
          // resolving.
          dependencyModule = new Module(dependencyId);
          dependencyModule.predefined = true;
          this.cache[dependencyPath] = dependencyModule;

          dependency = this.requireDependency(
              dependencyPath,
              dependencyModule,
              dependencyId,
              module
          );

        } else {
          dependency = dependency.resolveToInstance();
        }

        resolvedDependencies.push(dependency);
      }
    }

    return Promise.all(resolvedDependencies);
  };



  /**
   * Execute the module factory function and set the result as instance for
   * this module.
   *
   * @param  {Module} module The object representing the module.
   * @return {mixed} The instance which the module factory created.
   * @this {Minjector}
   */
  _proto.callFactory = function(module) {
    var instance;
    try {
      instance = module.factory.apply(
        null,
        module.resolvedDependencies
      );
    } catch (e) {
      console.error('Error calling module factory function (' + module.path +
          '): ', e.stack ? e.stack : e);
    }

    module.instance = instance;
    module.fireOnCreation();
    module.listen = [];
    return instance;
  };


  /**
   * @param  {string} id Id of the dependency/module to require.
   * @return {object|function} The factory result (created module).
   * @this {Minjector}
   */
  /**
   * Enviroment specific "require".
   * "Node.js" is using "require" to include modules.
   *
   * @param  {string} path Path of the dependency
   * @param  {Module} module Module of the dependency
   * @param  {string} id Id of the dependency
   * @param  {Module} parentModule Parent module of the dependency
   * @return {Promise}
   * @this {Minjector}
   */
  _proto.requireDependency = isNodeJs ?

    function(path, module, id, parentModule) {
      var _this = this;
      return new Promise(function(resolve) {
        process.nextTick(function() {
          require(path);
          _this.processDefineQueue(id, parentModule);
          if (module.predefined === true) {
            // If the required dependency is still set to predefined then there
            // was no define(...) (not anonym nor explicit) which defines the
            // requested dependency, therefore resolve to undefined, so that
            // the factory function gets called
            module.predefined = false;
            resolve(undefined)
          } else
            resolve(module.resolveToInstance());
        });
      });
    } :

    function(path, module, id, parentModule) {
      var _this = this;
      return new Promise(function(resolve, reject) {
        var scriptTag = document.createElement('script');
        scriptTag.src = path + '.js';
        scriptTag.type = 'text/javascript';
        scriptTag.charset = 'utf-8';

        scriptTag.addEventListener('load', function() {
          _this.processDefineQueue(id, parentModule);
          if (module.predefined === true) {
            // If the required dependency is still set to predefined then there
            // was no define(...) (not anonym nor explicit) which defines the
            // requested dependency, therefore resolve to undefined, so that
            // the factory function gets called
            module.predefined = false;
            resolve(undefined)
          } else
            resolve(module.resolveToInstance());

        }, false);

        _this.domDocumentHead.appendChild(scriptTag);
      });
    };


  if (!isNodeJs) {
    /**
     * Performance issue. Access document only once and save reference.
     * @type {Element}
     */
    _proto.domDocumentHead = document.head;

  }


  /**
   * Create the path for an module by its id.
   *
   * Candiate for memoizing!
   *
   * @param  {string} id Id of the dependency/module to require.
   * @param {object} parent The parent module of defined id.
   * @return {string}
   * @this {Minjector}
   */
  _proto.createPath = function(id, parent) {
    if (id === 'require')
      return id;

    var cfg = this.cfg;
    // Check map config for module.
    var fc, path, mapping = parent ? cfg.map[parent.id] : null;
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
        cfg.baseUrl :
        cfg.libUrl;

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
   * @param {Module} parentModule The module in which this require gets called.
   * @return {mixed} The required module on synchronous call.
   * @this {Minjector}
   */
  _proto.require = function(mixed, callback, parentModule) {
    if (typeof mixed === 'string') {
      return this.cache[this.createPath(mixed, parentModule)].instance;

    } else if (Array.isArray(mixed)) {
      var tmpModule = new Module(
        parentModule ? parentModule.id : undefined,
        mixed, // dependencies
        callback // factory
      );

      if (parentModule)
        tmpModule.parent = parentModule;

      // Resolving dependencies and calling factory function.
      this.createModule(tmpModule);
    } else {
      throw new Error('Invalid arguments signature for require()');
    }
  };


  /**
   * Add instantiated module in ready state to the cache.
   *
   * @param  {string} id       Module id.
   * @param  {mixed} instance The result of the modules factory function.
   * @this {Minjector}
   */
  _proto.mockModule = function(id, instance) {
    var module = new Module(id);
    module.instance = instance;
    this.cache[this.createPath(id)] = module;
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
