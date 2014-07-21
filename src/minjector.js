/**
 * AMD / CommonJS modules implementation.
 * It does not intent to be a complete
 * AMD / CommonJS implementation. There might be functionality we
 * are not interested in.
 * For example we do not (re)implement "require".
 *
 * However this piece of code is intended to be light weight (mobile first)
 * and run in any environment (browser, nodejs).
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
 *   base: './some/dir'
 * }
 *
 * @param {object} cfg A configuration.
 * @constructor
 */
var MinjectorClass = function(cfg) {
  this.config(cfg);
  this.contextId = null;
  this.cache = {};
  this.defineQueue = [];
  this.processingWaitingForNextTick = false;

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
  this.cfg = {};

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
    throw new Error('InvalidArgumentException: Missing factory function.');

  var module = this.cache[id];
  if (module && !(module instanceof Promise)) {
    // Testing against is Promise allows modules which defines an id
    // like there "file id"
    throw new Error('InvalidStateException: Ambiguous module: ' + id);
  }

  this.defineQueue.push({
    id: id,
    dependencies: dependencies,
    factory: factory
  });

  this.processOnNextTick();
};


/**
 * [createModule description]
 * @param  {object} module Actually all three define(...) params.
 * @return {mixed} The created module or Promise which will create it.
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

      // The dependency might be already defined.
      dependency = this.cache[dependencyId];

      if (!dependency) {
        dependency = this.requireDependencyInContext(dependencyId);
      }

      // Either the never declared dependency or the knowing but still loading
      // dependency meight a promise. In either case this module has to wait
      // for this dependency to be loaded.
      if (!hasPromise && dependency instanceof Promise)
        hasPromise = true;

      resolvedDependencies.push(dependency);
    }
  }

  if (!hasPromise) {
    // Synchronously process the queue if we are in Node.js and
    // do not need to use promise cause of synchronous require.
    // Or there are simply no dependencies to fetch asynchronous.
    return this.callFactoryCallback(
        module.id,
        resolvedDependencies,
        module.factory
    );
  }

  // Return a promise which waits for all dependencies to finish.
  // A little bit "tricky" here to return the promise so that
  // we can and will add another .then() (@see this.requireDependency()
  // for browsers) to chain async loading recursively.
  return Promise.all(resolvedDependencies)
    .then(function(resolvedDependencies) {
        var _module = module;
        return this.callFactoryCallback(
            _module.id,
            resolvedDependencies,
            _module.factory
        );
      }.bind(this))
    .catch (function(rejected) {
        console.log('Error occured: ' + rejected + '\n' + rejected.stack);
      });
};


/**
 * Execute the factory and add the result to the cache.
 * @param  {string} id
 * @param  {array} resolvedDependencies
 * @param  {function} factory
 * @return {mixed} The created module or Promise which will create it.
 * @this {Minjector}
 */
_proto.callFactoryCallback = function(id, resolvedDependencies, factory) {
  var module = factory.apply(null, resolvedDependencies);
  this.cache[id] = module;
  return module;
};


/**
 * This is actually necessary to support define(...) calls with no id given.
 * These call get the "file id". Therefore we that this id as
 * context to apply if and only if no explicit id is set.
 * However, you should NOT set an id which does not equal to the "file id".
 * Set another explicit id only if you have multiple defines() in a single file.
 *
 * @param  {string} id
 * @return {mixed} The created module or Promise which will create it.
 * @this {Minjector}
 */
_proto.requireDependencyInContext = function(id) {
  var saveContext = this.contextId;
  this.contextId = id;
  var result = this.requireDependency(id);
  this.contextId = saveContext;
  return result;
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
  _proto.requireDependency = function(id) {
    require(this.cfg.base + id);
    return this.processDefineQueue(id);
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
  _proto.requireDependency = function(id) {
    var __this = this;
    var promiseCreatingModule = new Promise(function(resolve, reject) {
      var _this = __this;

      var scriptTag = document.createElement('script');
      scriptTag.src = _this.cfg.base + id + '.js';
      scriptTag.type = 'text/javascript';
      scriptTag.charset = 'utf-8';
      scriptTag._moduleId = id;

      scriptTag.addEventListener('load', function() {
        // Define was called from the loaded script.
        // This event and the execution of the loaded script
        // happens synchronous.
        // Therefore this.defineQueue holds now all the in this
        // loaded script executed define()'s and we want to process them now.

        // Kind of tricky here. This might return the Promise from
        // @see this.createModule() which resolves if all dependencies of
        // this module are reseolved. Then and only then we can create
        // and resolve this module as well. This closes the recursive
        // "Promise / async loading" chain
        var resolvedModule = _this.processDefineQueue(scriptTag._moduleId);
        if (resolvedModule instanceof Promise) {
          resolvedModule.then(function(mymod) {
            resolve(mymod);
          });
        } else {
          // We can resolve immediately if all dependencies are already resolved
          // or don't need asynchronous loading.
          resolve(resolvedModule);
        }

      }, false);

      _this.domDocumentHead.appendChild(scriptTag);
    });

    // We need to save the Promise which will create this module in the
    // cache now. Cause there might come more modules which depends on this one
    // but have to wait before it is loaded. Therefore we "precaching" the
    // modules promise and reacting appropriately at all other places.
    this.cache[id] = promiseCreatingModule;
    return promiseCreatingModule;
  };
}


/**
 * Process all calls to define(...). This is necessary to support multiple
 * modules in a single file.
 *
 * @param  {string} moduleId This is the id which comes from the
 * dependency declaration.
 * @return {mixed} The created module or Promise which will create it.
 * @this {Minjector}
 */
_proto.processDefineQueue = function(moduleId) {
  var queue = this.defineQueue;

  // On purpose: Process all define() calls...
  var module, creatingQueue = [];
  while (queue.length) {
    module = queue.pop();

    if (!module.id)
      module.id = moduleId;

    creatingQueue.push(module);
  }

  this.processingWaitingForNextTick = false;

  // and then start creating the modules which has been defined.
  // So we do not get confused about the define()'s in the queue and new
  // incomming ones during module creation and its dependencies.
  // Because this distinction wouldn't be possible anymore.
  var resultModule, creationResult;
  while (creatingQueue.length) {
    module = creatingQueue.pop();

    creationResult = this.createModule(module);
    if (module.id === moduleId)
      resultModule = creationResult;
  }

  return resultModule;
};


/**
 * This is necessary for Node.js to get all define()'s called in a single file
 * before processing there dependencies. Other wise we would get confused
 * about old define()'s and new one from dependencies.
 * @return {void}
 * @this {Minjector}
 */
_proto.processOnNextTick = function() {
  if (this.processingWaitingForNextTick)
    return;

  this.processingWaitingForNextTick = true;

  if (this.isNodeJs) {
    process.nextTick(this.Bound.processDefineQueue);
  } else {
    window.setTimeout(this.Bound.processDefineQueue, 0);
  }
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
