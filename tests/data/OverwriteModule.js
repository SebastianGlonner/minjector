define(function() {

  return {anonym1: 1};
});

define('MixedId', function() {
  return {mixed: 'id'};
});

// This just overwrite the first one!
define(function() {

  return {anonym2: 2};
});
