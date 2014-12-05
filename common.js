var DIR_ROOT = __dirname + '/';


/**
 * Directories
 * @type {Object}
 */
var common = {
  DIR: {
    ROOT: DIR_ROOT,
    SRC: DIR_ROOT + 'src/',
    BIN: DIR_ROOT + 'bin/',
    TESTS: DIR_ROOT + 'tests/',
    TESTS_DATA: DIR_ROOT + 'tests/data/'
  }
};


/**
 * Include directory. You may want to change this
 * from source to binary directory in productive environment.
 */
common.INCLUDE = common.DIR.SRC;


/**
 * @type {[type]}
 */
module.exports = common;
