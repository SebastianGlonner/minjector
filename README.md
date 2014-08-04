minjector
=========

## Minjector implements an AMD like module loader for browsers and Node.js.

[AMD Specification](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)

# Why / Goals
> Mobile first

* Simplicity! (no support for full AMD spec)
* Currently, minimized (uglifyjs) less than 3kb size.
* Absolute id / path resolution
* Node.js and Browsers (Chrome, FireFox) support

# Design decisions
> to best serve the mobile first goal.

__No parsing of the function body parsing__

In my personal opition there is absolutely no point in parsing
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

__Absolute id/path resolution relative to one configurable base path.__

If you want to change the path or id of a module you will have to change
this one particular unique id/path everywhere you load the module as dependency
(this one might be easy due to mostly unique strings which are easy to search
and replace). Furthermore you have less problems when concatenate or caching
modules, because the id is unique through its path as well.

The other side, loading modules relative to the current module, would mean you have
to change code at 2 places throughout the code. Once, as before, everywhere you load
the module as dependency and all modules you loaded relative to this particular one.
And you need to normalize id/path to find cached modules.

__No mixed/fallback require in node environments.__

If you want to require a node module you probably want to use some node only
functionality anyway
and there would be no point in using it on browser side either.
If you want a module for both sides just use define() only or local require().
Or just require Node.js modules outside and define(['require', ...]).

__No support for plugins like suggested in the AMD spec.__

Simplicity, this implementation serves to load JavaScript AMD like modules only.


# Examples
TODO

# Tests
* [Jasmine (Node.js implementation)](https://github.com/pivotal/jasmine)
* [Jasmine (Browser implementation)](http://jasmine.github.io/2.0/introduction.html)

Tests implemented with jasmine 2.0. Running in Node.js and Browsers

# Roadmap
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
