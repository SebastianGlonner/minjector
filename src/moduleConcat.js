module.exports = function(parsedFile) {
  var result = '';

  var modules = parsedFile.getModules();

  var module, moduleId, dependencies, dependency, dependencyId;
  for (moduleId in modules) {
    module = modules[moduleId];

    dependencies = parsedFile.getDependenciesRecursive(module.getId());

    for (dependencyId in dependencies) {
      if (!dependencies.hasOwnProperty(dependencyId))
        continue;

      dependency = dependencies[dependencyId];

      result += dependency.getRemoteModule().getCode();
    }
  }

  return result + parsedFile.getParsedCode().getCode();
};
