minjector
=========

Minjector implements an AMD like module resolution.
[AMD Specification](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)

# Why / Goals
> Mobile first

* Simplicity! (no support for full AMD spec)
* Currently, minimized (uglifyjs) less than 3kb size.
* Absolute id / path resolution
* Support for module mocking for easier tests
* Node.js and Browsers (Chrome, FireFox) support
* No legacy browsers support

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

## Detailed thoughts

> I'am aiming for simplicity to best serve the mobile first goal.

__Absolute id/path resolution relative to one configurable base path.__

If you want to change the path or id of a module you will have to change
this one particular unique id/path everywhere you load the module as dependency
(this one might be easy due to mostly unique strings search and replaceable).
Furthermore you have less problems when concatenate or caching modules, because
the id is unique everywhere.

The other side, loading modules relative to the current module, would mean you have
to change code at 2 places throughout the code. Once, as before, everywhere you load
the module as dependency and all modules you loaded relative to this particular one.
And you need to normalize id/path to find cached modules.
So far there are 3 disadvantages this way, i will go the other way.

__No mixed/fallback require in node environments.__

If you want to require a node module you probably want to use some node only
functionality anyway
and there would be no point in using it on browser side either.
If you want a module for both sides just use define() only or local require().
Or just require Node.js modules outside and define(['require', ...]).

__No support for plugins like suggested in the AMD spec.__

Simplicity, this implementation serves to load JavaScript AMD like modules only.


