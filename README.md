minjector
=========

## Minjector implements an AMD like module loader for browsers and Node.js.
Truly Node.js does not require an AMD loader. Despite of this it is supported
to allow writing modules which are required in browsers and Nodes.js. The
performance drawback for Node.js is not to much since all modules still get
included synchronously. You just get littel overhead through .onNextTicke()
which you might want to consider if you require to save every single
millisecond.

You dont know what an AMD loader is:
[AMD Specification](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)

You dont know why you should use an AMD loader:
Checkout excellent page:
[requirejs](http://requirejs.org/docs/whyamd.html)

# Why reimplementing this despite of their exists requirejs and co.?
> Mobile first

* Simplicity! (no support for full AMD spec)
* Minimized (uglifyjs) about 3.3kb size, gzip about 1.4 kb size.
* Node.js and Browsers (Chrome, FireFox) support

# Config

> libUrl

All modules which start NOT with '/' or '.' will be required relative to this
directory!
Inspired from requirejs and acting like Node.js, this is the lib directory
where you want to put modules/libraries like e. g. jQuery.

> baseUrl

All modules which start with '/' or '.' will be required relative to this
directory!

> map

Mapp modules for modules to other modules.
For more details:
[AMD Specification](https://github.com/amdjs/amdjs-api/wiki/Common-Config#map-)

# Dont's you want to know
* Do NOT require a module which has no module defined
* Do NOT require a module where you set explicity another id for the module
than the required path
```
define(['/my/module'], ...);
```
```
define('/my/module_differs', [...], ...)
```

* EACH character of the module id / path matters
'/my/module' !== 'my/module'

* Do not require 2 modules which are in the same file like:
```
define(['/my/module1', '/my/module2'], ...);
```
```
define('/my/module1', ...);

define('/my/module2', ...);
```
The implementation immediately tries to load a file define '/my/module2' because
we do not wait for files to be included to check if the required dependency is
in their (performance nonesense).

# Extensive Examples

Suggesting the following directory structure
```
- myApp
    |- modules
    |   |- home
    |   |   |- controller.js
    |   |   |- model.js
    |   |- base.controller.js
    |   |- base.model.js
    |- lib
    |   |- minjector.js
    |   |- jquery.js
    |- index.js
    |- index.html
```

You want to configure Minjector in the index.(js|html) like:
```
// Browser
Minjector.config({
  baseUrl: './',
  libUrl: './lib/'
});

// Node.js
Minjector.config({
  baseUrl: __dirname + '/',
  libUrl: __dirname + '/lib/'
});
```

# Design decisions
> to best serve the mobile first goal.

__No parsing of the function body__

In my personal opinion there is no point in parsing
the function.toString() and searching for
"var a = require('a');" things. And since this is freaking useless
performance overkill for convenience, i like the approach of just proper
code formatting.

__No support for "empty modules"__

There is no support for something like
```
define(['SomeFile'], function() {

})
```
where SomeFile.js contains something like:
```
var POLLUTING_GLOBAL_NAMESPACE = 'is no good coding style';
/* and no more code */
```
Since we are encouraged and want to use the "Module Pattern" we do not
introduce possibilities to workaround this by extra code. If you load a
module you have to define() a module or you will receive an ugly error.

__No / less error handling due to wrong usage of this framework__

Since the API is rather simple i did not introduce extra bytes for
error handling of wrong usage misstakes.

__No handling of circular dependencies__

There is no use in handling circular dependencies since it is, in almost
every case, better coding style to add another module which serves
as relation for preventing circular dependencies.


__No mixed/fallback require in node environments.__

If you want to require a node module you probably want to use some node only
functionality anyway
and there would be no point in using it on browser side either.
If you want a module for both sides just use define() only or local require().
Or just require Node.js modules outside and define(['require', ...]).

__No support for plugins like suggested in the AMD spec.__

Simplicity, this implementation serves to load JavaScript AMD like modules only.

# Tests
* [Jasmine (Node.js implementation)](https://github.com/pivotal/jasmine)
* [Jasmine (Browser implementation)](http://jasmine.github.io/2.0/introduction.html)

Tests implemented with jasmine 2.0. Running in Node.js and Browsers

# Roadmap / Issues

* Throw meaningful error in case of Factory function does not return

* Add "map" config

* Optimizer script, basically concatening modules,
  but supporting some kind of "top level entry points".
  Means that if I have a single page application and have multiple
  views, I just don't want to concat all JavaScript files but only these
  which i need to load the initial view completely and add other
  things in dependence of the users navigation (mobile first). Outstanding question
  is how to treat multiple top level entry points?

* Simplified (even less code / size) version for optimized environments. If
  we are cabable of ordering the modules by optimization script, we do not need
  some pieces of code and therefore being cabable of reducing
  the script sice even further.

* Maybe add more "wrong usage" errors and convenience methods. This would be no
  drawback since we planing to add an optimized version.

* Support for loader plugins

* local require() calls does not consider config.map at the moment

* jasmine-node badly failes for some sort of global exceptions?!
  Require investigation and I consider changing the test framework.

# Feedback / Review / Criticism
I appreciate any kind of feedback!
Therefore, if you think I'am doing something good or bad, please
give me some of your time and tell me :)
I never want to stop learning ;)

## Dependencies / Support
__Using native JavaScript Promises__

_@2014/07/21_
* Node.js > 0.11.x (unstable)
* No support for IE, Safari
* No legacy browsers support
