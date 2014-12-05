var MinjectorElement = require('./MinjectorElement');


var parseStringLiteralRegex = /^"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)'$/;


/**
 * Parse a string literal. Return null if we have no absolute string literal
 * but any dynamic constructs.
 *
 * 'mein string'         => mein string
 * myVar + 'mein String' => null
 *
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
var parseStringLiteral = function(value) {
  value = value.trim();
  var res = parseStringLiteralRegex.exec(value);
  if (!res)
    return null;

  if (res[1])
    return res[1];
  if (res[2])
    return res[2];

  return null;
};


/**
 * Parse array containing list of string literals like:
 * ['dep1', 'Dep2'].
 *
 * Returns
 *   {MinjectorElement.Param} or
 *   {false} if the value does not begin with '[' (is no array).
 *
 * @param  {string} value The string to parse.
 * @return {mixed}
 */
var parseArrayDependenciesParam = function(value) {
  value = value.trim();
  if (value.charAt(0) !== '[')
    return false;

  value = value.substring(1, value.length - 1);
  var strLiterals = [];
  var parts = value.split(',');
  var literal;
  for (var i = 0, l = parts.length; i < l; i++) {
    strLiterals.push(parseStringLiteral(parts[i]));
  }

  return new MinjectorElement.Param(
      strLiterals,
      strLiterals.some(function(element) {
        return element === null;
      })
  );
};


/**
 * Convenience method creating {@see MinjectorElement.Param} parameter after
 * parsing the value.
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
var parseStringIdParam = function(value) {
  value = parseStringLiteral(value);
  return new MinjectorElement.Param(
      value === null ? '' : value,
      value === null
  );
};


/**
 * Extract a part of the given code between the 2 given tokens. Code starting
 * from the right side (the end of) of the first token until the beginning
 * of the second token. E.g.:
 *
 * Code:         define('test', )
 * First token:  (
 * Second token: ,
 * Result:       'test'
 *
 * @param  {string} code
 * @param  {Token} startToken
 * @param  {Token} endToken
 * @return {string}
 */
var extractCodaPartAmongTokens = function(code, startToken, endToken) {
  return code.substring(
      startToken.getLastIndex(),
      endToken.getStartIndex()
  );
};


/**
 * This functions searches 3 specialized tokens in the define structure:
 *   define('id', ['dep', 'dep2'], function ...)
 * The 3 tokens are the first bracket and the first and second parameter
 * separator comma.
 * They will be returned in this order regardless of the tokens exist or not.
 * If we parse:
 *   require(...)
 * with (parseRequireSignature = true) the returned array is appropriate and
 * stop parsing after the first comma.
 *
 * @param {TokenStructure} tokenStructure
 * @param {boolean} parseRequireSignature
 *
 * @return {array}
 */
var findSignatureTokens = function(tokenStructure, parseRequireSignature) {
  var scopeLevel = 0;
  var tokenArray = tokenStructure.getTokens();
  var firstBracket, firstComma, secondComma, token, identifier;
  for (var i = 0, l = tokenArray.length; i < l; i++) {
    token = tokenArray[i];
    identifier = token.getIdentifier();

    if (!firstBracket) {
      if (identifier === 'roundBracketOpen') {
        firstBracket = token;
      }

      continue;
    }

    if (identifier === 'roundBracketOpen' || identifier === 'arrayOpen') {
      scopeLevel++;
      continue;
    }

    if (identifier === 'roundBracketClose' || identifier === 'arrayClose') {
      scopeLevel--;
      continue;
    }

    if (scopeLevel > 0)
      continue;

    if (!firstComma) {
      if (identifier === 'comma') {
        firstComma = token;

        if (parseRequireSignature) {
          // If we parse an require(...) call there is nothing more
          // interesting after the first comma.
          return [firstBracket, firstComma];
        }
      }

      continue;
    }

    if (!secondComma && identifier === 'comma') {
      secondComma = token;

      continue;
    }
  }

  if (parseRequireSignature) {
    // If we parse an require(...) and reached the end of the structure
    // we have 1 parameter only. Return the first bracket and the last token
    // which is the closing bracket of the first one.
    return [firstBracket, token];
  }

  return [firstBracket, firstComma, secondComma];
};


/**
 * Returns array of the parsed define signature paremeters and the first
 * bracket token.
 *
 * @param {array} tokenStructure
 *
 * @return {array} [firstBracketToken, id, dependencies]
 */
var structure2DefineSignatureParameters = function(tokenStructure) {
  var signatureTokens = findSignatureTokens(tokenStructure, false);
  var firstBracket = signatureTokens[0];
  var firstComma = signatureTokens[1];
  var secondComma = signatureTokens[2];

  if (!firstComma) {
    // Signature consists of 1 param only
    // therefore the result is of course no dependencies, no id.
    return [
      firstBracket,
      new MinjectorElement.Param(''),
      new MinjectorElement.Param([])
    ];

  }

  var id = null;
  var dependencies = null;

  var firstParameterString =
      extractCodaPartAmongTokens(
          tokenStructure.getCode(),
          firstBracket,
          firstComma
      );

  if (!secondComma) {
    // Signature consists of 2 params only, extract dependencies.

    // First param can be id definition or dependency array.
    var isArray = parseArrayDependenciesParam(firstParameterString);

    if (isArray !== false) {
      // First param is array of dependencies.
      id = new MinjectorElement.Param('');
      dependencies = isArray;

    } else {
      // First param is no array
      id = parseStringIdParam(firstParameterString);
      dependencies = new MinjectorElement.Param([]);

    }

  } else {
    // Signature consists of all 3 params

    var secondParameterString =
        extractCodaPartAmongTokens(
            tokenStructure.getCode(),
            firstComma,
            secondComma
        );

    id = parseStringIdParam(firstParameterString);
    dependencies = parseArrayDependenciesParam(secondParameterString);

  }

  return [firstBracket, id, dependencies];
};


/**
 * Returns array of the parsed require signature paremeters and the first
 * bracket token.
 *
 * @param {array} tokenStructure
 *
 * @return {array} [firstBracketToken, id, dependencies]
 */
var structure2RequireSignatureParameters = function(tokenStructure) {
  var signatureTokens = findSignatureTokens(tokenStructure, true);
  var firstBracket = signatureTokens[0];
  var secondToken = signatureTokens[1];

  var firstParameterString =
      extractCodaPartAmongTokens(
          tokenStructure.getCode(),
          firstBracket,
          secondToken
      );

  var isArray = parseArrayDependenciesParam(firstParameterString);

  if (isArray) {
    return [
      firstBracket,
      null,
      isArray
    ];
  } else {
    return [
      firstBracket,
      parseStringIdParam(firstParameterString),
      null
    ];

  }
};


/**
 * @type {Object}
 */
module.exports = {

  /**
   * Create {@see MinjectorElement} of the given token structure.
   * Representing a define(...) definition.
   *
   * @param  {TokenStructure} tokenStructure
   * @return {MinjectorElement}
   */
  toDefine: function(tokenStructure) {
    var parameters = structure2DefineSignatureParameters(tokenStructure);
    return new MinjectorElement(
        tokenStructure,
        'define',
        parameters[0],
        parameters[1],
        parameters[2],
        tokenStructure.atTopLevelScope() === false
    );
  },


  /**
   * Create {@see MinjectorElement} of the given token structure.
   * Representing a require(...) definition.
   *
   * @param  {TokenStructure} tokenStructure
   * @return {MinjectorElement}
   */
  toRequire: function(tokenStructure) {
    var parameters = structure2RequireSignatureParameters(tokenStructure);
    return new MinjectorElement(
        tokenStructure,
        'require',
        parameters[0],
        parameters[1],
        parameters[2],
        tokenStructure.atTopLevelScope() === false
    );

  }
};
