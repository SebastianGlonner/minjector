describe('minjector parser', function() {
  var common = require('../../common.js');

  var parser = require(common.INCLUDE + 'parser.js');
  var Token = require(common.INCLUDE + 'Token.js');
  var fs = require('fs');

  // Parse test file
  var content =
      fs.readFileSync(
          common.DIR.TESTS_DATA + '/building/parserTest.js', {
            encoding: 'utf8'
          }
      );

  var parsedCode = parser.parse(content);

  describe('can parse js files', function() {
    // Comparison test helper

    it('recognize definitive function calls', function() {
      // More info {@link Token.isDesiredFuncCall()}

      var createTokenFromRegexResult = function(code) {
        var regex = new RegExp('define', 'g');
        var res = regex.exec(code);
        return new Token(
            '', // identifier, doesnt matter here
            code,
            'define', // input
            res.index, // start index
            regex.lastIndex // last index
        );
      };

      expect(
          createTokenFromRegexResult(' define(').isDesiredFuncCall()
      ).toBeTruthy();

      expect(
          createTokenFromRegexResult('define(').isDesiredFuncCall()
      ).toBeTruthy();

      expect(
          createTokenFromRegexResult('adefine(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult('_define(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult(' define2(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult(' define_(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult(' definee(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult('.define(').isDesiredFuncCall()
      ).toBeFalsy();

      expect(
          createTokenFromRegexResult(' define.et(').isDesiredFuncCall()
      ).toBeFalsy();

      // Yep. Its a feature and no bug. {@see Token.isDesiredFuncCall()}
      expect(
          createTokenFromRegexResult(' define (').isDesiredFuncCall()
      ).toBeFalsy();
    });

    xit('create expected token streams', function() {
      var defineTokenStreamStruc = parsedCode.getDefines()[0];
      // TODO but doubtable if this is useful.
    });

    it('find top level define()\'s', function() {
      expect(parsedCode.getDefines().length).toBe(9);
    });

    it('find top level require()\'s', function() {
      expect(parsedCode.getRequires().length).toBe(0);
    });

    it('find all element\'s', function() {
      expect(parsedCode.getElements().length).toBe(13);
    });
  });

  describe('can extract parameters', function() {
    it('parse define dependencies parameter', function() {
      var defineElement = parsedCode.getDefines()[0];

      var deps = defineElement.getDependencies().getValue();
      expect(deps[0]).toBe('dep1');
      expect(deps[1]).toBe('Dep2');
      expect(defineElement.isInline()).toBe(false);
    });

    it('parse define id parameter', function() {
      var defineElement = parsedCode.getDefines()[1];

      var id = defineElement.getId();
      expect(id.getValue()).toBe('parseTestExplicit');
      expect(id.isDynamic()).toBe(false);
    });

    it('parse define id and dependencies parameters', function() {
      var defineElement = parsedCode.getDefines()[3];

      expect(defineElement.isInline()).toBe(false);

      var id = defineElement.getId();
      expect(id.getValue()).toBe('completeDefine');
      expect(id.isDynamic()).toBe(false);

      var deps = defineElement.getDependencies().getValue();
      expect(deps[0]).toBe('OneDep');
      expect(deps[1]).toBe('SecondDep');
    });

    xit('parse require id parameter', function() {
      var requireElement = parsedCode.getElements()[1];

      var id = requireElement.getId();
      expect(id.getValue()).toBe('dynTest1');
      expect(id.isDynamic()).toBe(false);
    });

    it('parse require dependencies parameter', function() {
      var requireElement = parsedCode.getElements()[10];

      var deps = requireElement.getDependencies().getValue();
      expect(deps[0]).toBe('lala');
      expect(deps[1]).toBe('Bla');
    });

    it('recognize dynamic define parameter', function() {
      var defineElement = parsedCode.getDefines()[6];

      var id = defineElement.getId();
      expect(id.getValue()).toBe('');
      expect(id.isDynamic()).toBe(true);
      expect(defineElement.isInline()).toBe(false);

      var defineElement2 = parsedCode.getDefines()[5];

      var dep = defineElement2.getDependencies();
      expect(dep.getValue()[0]).toBe(null);
      expect(dep.isDynamic()).toBe(true);
      expect(defineElement.isInline()).toBe(false);
    });

    it('recognize inline defines', function() {
      var defineElement = parsedCode.getElements()[8];

      var id = defineElement.getId();
      expect(id.getValue()).toBe('IamInlineModule');
      expect(defineElement.isInline()).toBe(true);
    });
  });


  it('can handle parent and children associations', function() {
    var content =
        fs.readFileSync(
            common.DIR.TESTS_DATA + '/building/InlineRequire.js', {
              encoding: 'utf8'
            }
        );

    var parsedCode = parser.parse(content);

    expect(parsedCode.getDefines().length).toBe(1);

    var defineElement = parsedCode.getDefines()[0];

    var defineChildren = defineElement.getChildren();

    expect(defineChildren.length).toBe(3);
    expect(defineChildren[0].getChildren().length).toBe(0);
    expect(defineChildren[1].getType()).toBe('define');
    expect(defineChildren[1].getChildren().length).toBe(0);
    expect(defineChildren[2].getChildren().length).toBe(1);

    var requireChildren = defineChildren[2];
    expect(requireChildren.getChildren().length).toBe(1);

    var deps = requireChildren.getChildren()[0].getDependencies().getValue();
    expect(deps[0]).toBe('./RecInDep5');
  });

});
