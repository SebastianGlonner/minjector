var fileParser = require('./fileParser.js');
var doConcat = require('./moduleConcat.js');
var fs = require('fs');

var getFileFromConfig = function(mixed) {
  var type = typeof mixed;
  if (type === 'string')
    return mixed;

  if (type !== 'object' || !mixed.id) {
    throw new Error('Invalid config value "files": ' +
        JSON.stringify(mixed, null, '\t'));
  }

  return mixed.id;
};

var writeFile = function(path, content) {
  fs.writeFile(path, content, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = function(config, minjector) {
  var result = {};

  if (!config || typeof config !== 'object')
    throw new Error('Invalid config argument. Expecting object.');

  files = config.files;
  if (!files) {
    throw new Error('Invalid config argument. Option "files" required.');
  }

  destination = config.destination;
  if (!files) {
    throw new Error('Invalid config argument. Option "destination" required.');
  }

  if (!Array.isArray(files))
    files = [files];

  var file, concatenated;
  for (var i = 0, l = files.length; i < l; i++) {
    // file = files[i];
    fileParser(getFileFromConfig(files[i]), minjector)
      .then(function(parsedFile) {
          concatenated = doConcat(parsedFile);

          writeFile(destination + parsedFile.getId() + '.js', concatenated);

      })
      .catch (function(e) {
          console.error(e.stack);
      });

  }

};
