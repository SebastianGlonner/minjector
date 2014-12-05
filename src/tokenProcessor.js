/**
 * A token processor object.
 * @type {Object}
 */
module.exports = {

  consumeToken: function(state, parsedCode, token) {
    var identifier = token.getIdentifier();

    // Ignore all tokens if inside multi line comment
    var isMultiLineClose = identifier !== 'multiLineCommentClose';
    if (state.isInsideMultiComment() && isMultiLineClose) {
      return;
    }

    var consumed = parsedCode.addToken(token);

    var consumer = this.consumer[identifier];
    if (consumer) {
      consumer(state, parsedCode, token);
      if (consumed === false)
        parsedCode.addToken(token);
    }
  },

  consumer: {
    'define': function(state, parsedCode, token) {
      if (token.isDesiredFuncCall()) {
        parsedCode.startTrack(token);
        state.startTrackBrackets('define');
      }
    },
    'require': function(state, parsedCode, token) {
      if (token.isDesiredFuncCall()) {
        parsedCode.startTrack(token);
        state.startTrackBrackets('require');
      }
    },
    'roundBracketOpen': function(state, parsedCode, token) {
      state.enterParenthesis();

      if (state.isTrackingNextBracket()) {
        state.pushOpeningBracket();
      }
    },
    'roundBracketClose': function(state, parsedCode, token) {
      var closingType = state.pullClosingBracket();
      if (closingType === 'define') {
        parsedCode.finishElement('define', state.getScopeLevel() - 1 === 0);

      } else if (closingType === 'require') {
        parsedCode.finishElement('require', state.getScopeLevel() - 1 === 0);

      }

      state.leaveParenthesis();
    },
    'curlyBracketOpen': function(state, parsedCode, token) {
      state.enterScope();
    },
    'curlyBracketClose': function(state, parsedCode, token) {
      state.leaveScope();
    },
    // 'arrayOpen': function(state, parsedCode, token) {

    // },
    // 'arrayClose': function(state, parsedCode, token) {

    // },
    // 'singleLineComment': function(state, parsedCode, token) {

    // },
    'multiLineCommentOpen': function(state, parsedCode, token) {
      state.startCommentMulti();
    },
    'multiLineCommentClose': function(state, parsedCode, token) {
      state.resetComment();
    }
    // 'stringDoubleQuoted': function(state, parsedCode, token) {

    // },
    // 'stringSingleQuoted': function(state, parsedCode, token) {

    // },
    // 'comma': function(state, parsedCode, token) {

    // }
  }

};
