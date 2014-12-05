var UglifyJS = require('uglify-js');
var fs = require('fs');

module.exports = function(files) {
  var ast = null;
  files.forEach(function(file) {
      var code = fs.readFileSync(file, "utf8");
      ast = UglifyJS.parse(code, { filename: file, ast: ast });
  });

  return ast;
};