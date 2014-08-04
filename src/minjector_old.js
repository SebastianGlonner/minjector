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
  this.contextId = null;

  // Add local require
  this.cache = {
    'require': this.require.bind(this)
  };

  this.isDefined = {};
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
  // if (module && !(module instanceof Promise)) {
  if (module) {
  // if (id !== undefined && this.cache[id] !== undefined) {
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
console.log('start creating module: ' + module.id);
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
        dependency = this.isDefined[dependencyId];
      }

      if (!dependency) {
        dependency = this.requireDependencyInContext(dependencyId);
      }

        if (dependency === true) {
console.log('waiting a tick for creation of: ' + module.id);
          this.onTextTick(function() {
            this.createModule(module);
          }.bind(this));
          return;
        }

      // Either the never declared dependency or the knowing but still loading
      // dependency meight a promise. In either case this module has to wait
      // for this dependency to be loaded.
      if (!hasPromise && dependency instanceof Promise)
        hasPromise = true;

      resolvedDependencies.push(dependency);
    }
  }

console.log('finsish creating module: ' + module.id);
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
console.log('create module %s waiting for %j --- %j', module.id, module.dependencies, resolvedDependencies);
  // Return a promise which waits for all dependencies to finish.
  // A little bit "tricky" here to return the promise so that
  // we can and will add another .then() (@see this.requireDependency()
  // for browsers) to chain async loading recursively.

  var modulePromise = Promise.all(resolvedDependencies)
    .then(function(resolvedDependencies) {
        var _module = module;
        console.log('resolve module in promise.all: ' + _module.id);
        return this.callFactoryCallback(
            _module.id,
            resolvedDependencies,
            _module.factory
        );
      }.bind(this))
    .catch (function(rejected) {
        console.log('Error occured: ' + rejected + '\n' + rejected.stack);
      });

  this.isDefined[module.id] = modulePromise;
  return modulePromise;
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
  delete this.isDefined[id];
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
  var module = this.requireDependency(id);
  this.contextId = saveContext;
  return module;
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
    console.log('require dep: ' + id);
try {
    require(this.cfg.baseUrl + id);
} catch (e) {
  console.error(e);
}

    this.processDefineQueue(id);

    var dependency = this.cache[id];
    if (!dependency) {
      dependency = this.isDefined[id];

      if (dependency === true) {
console.log('waiting a tick for dependency: '+id);
        this.onTextTick(function() {
          this.requireDependency(id);
        }.bind(this));

        return true;
      }
    }

    console.log('return require dep: ' + id);
    return dependency;
// var modulePromise = new Promise(function (resolve, reject) {
//     this.processDefineQueue(id);

//     var dependency = this.cache[id];
//     if (!dependency) {
//       dependency = this.isDefined[id];

//       if (dependency === true) {
// console.log('waiting a tick for dependency: '+id);
//         this.onTextTick(function() {
//           this.requireDependency(id);
//         }.bind(this));

//         return;
//       }
//     }

//     console.log('return require dep: ' + id);
//     resolve(dependency);
// });

this.isDefined[id] = modulePromise;
return modulePromise;
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
console.log('create script tag for module: ' + id);
      var scriptTag = document.createElement('script');
      scriptTag.src = _this.cfg.baseUrl + id + '.js';
      scriptTag.type = 'text/javascript';
      scriptTag.charset = 'utf-8';
      scriptTag._moduleId = id;

      var onLoaded = function() {
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
        _this.processDefineQueue(scriptTag._moduleId);
        var resolvedModule = _this.cache[scriptTag._moduleId];
        if (!resolvedModule) {
          resolvedModule = _this.isDefined[scriptTag._moduleId];
          if (resolvedModule === true) {
              _this.onTextTick(onLoaded);
              return;

          }
        }

console.log('after promise.all for module: ' + scriptTag._moduleId);
        if (resolvedModule instanceof Promise) {
console.log('add then() to promise.all for module: ' + scriptTag._moduleId);
          resolvedModule.then(function(mymod) {
            console.log('resolve module in script loading: ' + scriptTag._moduleId);
            resolve(mymod);
          });
          resolvedModule.catch(function(rejected) {
              console.log('Error occured: ' + rejected + '\n' + rejected.stack);
            });
        } else {
          // We can resolve immediately if all dependencies are already resolved
          // or don't need asynchronous loading.
            console.log('resolve module in script loading: ' + scriptTag._moduleId);
          resolve(resolvedModule);
        }
      };

      scriptTag.addEventListener('load', onLoaded, false);

      _this.domDocumentHead.appendChild(scriptTag);
    });

    // We need to save the Promise which will create this module in the
    // cache now. Cause there might come more modules which depends on this one
    // but have to wait before it is loaded. Therefore we "precaching" the
    // modules promise and reacting appropriately at all other places.
    this.isDefined[id] = promiseCreatingModule;
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
console.log('processDefineQueue with module id: ' + moduleId);
  // On purpose: Process all define() calls...
  var module, creatingQueue = [];
  while (queue.length) {
    module = queue.pop();

    if (!module.id)
      module.id = moduleId;

    this.isDefined[module.id] = true;

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
    if (module.Id === moduleId)
      resultModule = creationResult;

  }

  return resultModule || creationResult;
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
    var closureId = this.contextId;
    process.nextTick(function() {
      this.processDefineQueue(closureId);
    }.bind(this));
    // process.nextTick(this.Bound.processDefineQueue);
  } else {
    window.setTimeout(this.Bound.processDefineQueue, 0);
  }
};

_proto.onTextTick = function(callback) {
  if (false && this.isNodeJs) {
    process.nextTick(callback);
  } else {
    setTimeout(callback, 0);
  }
};


/**
 * Local require implementation.
 * @param  {mixed}    id
 * @param  {function} callback
 * @return {mixed} The required module on synchronous call.
 * @this {Minjector}
 */
_proto.require = function(id, callback) {
  if (typeof id === 'string') {
    return this.cache[id];
  } else {
    define.call(this, id, callback);
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
