"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugin/src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var t6 = __toESM(require("@babel/types"));
var import_node_path2 = __toESM(require("node:path"));

// plugin/src/consts.ts
var REACT_NATIVE_COMPONENT_NAMES = [
  "ActivityIndicator",
  "View",
  "Text",
  "Image",
  "ImageBackground",
  "KeyboardAvoidingView",
  "Pressable",
  "ScrollView",
  "FlatList",
  "SectionList",
  "Switch",
  "TextInput",
  "RefreshControl",
  "TouchableHighlight",
  "TouchableOpacity",
  "VirtualizedList",
  "Animated",
  "SafeAreaView"
  // Modal - there is no exposed native handle
  // TouchableWithoutFeedback - can't accept a ref
];
var REPLACE_WITH_UNISTYLES_PATHS = [
  "react-native-reanimated/src/component",
  "react-native-reanimated/lib/module/component"
];
var REPLACE_WITH_UNISTYLES_EXOTIC_PATHS = [];
var NATIVE_COMPONENTS_PATHS = {
  imports: [
    {
      name: "NativeText",
      isDefault: false,
      path: "react-native/Libraries/Text/TextNativeComponent",
      mapTo: "NativeText"
    },
    {
      isDefault: true,
      path: "react-native/Libraries/Components/View/ViewNativeComponent",
      mapTo: "NativeView"
    }
  ]
};

// plugin/src/exotic.ts
var t2 = __toESM(require("@babel/types"));

// plugin/src/import.ts
var t = __toESM(require("@babel/types"));
function getComponentPath(state, name) {
  if (!state.opts.isLocal) {
    return `react-native-unistyles/components/native/${name}`;
  }
  if (state.opts.localPath) {
    return `${state.opts.localPath}/src/components/native/${name}`;
  }
  return state.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/src/components/native/${name}`) ?? "";
}
function addUnistylesImport(path2, state) {
  const localNames = Object.keys(state.reactNativeImports);
  const names = Object.values(state.reactNativeImports);
  const pairs = Object.entries(state.reactNativeImports);
  const nodesToRemove = [];
  path2.node.body.forEach((node) => {
    if (t.isImportDeclaration(node) && node.source.value === "react-native") {
      node.specifiers = node.specifiers.filter(
        (specifier) => !localNames.some((name) => name === specifier.local.name)
      );
      if (node.specifiers.length === 0) {
        nodesToRemove.push(node);
      }
    }
  });
  names.forEach((name) => {
    const rnWebImport = path2.node.body.find(
      (node) => t.isImportDeclaration(node) && node.source.value === `react-native-web/dist/exports/${name}`
    );
    if (rnWebImport) {
      rnWebImport.specifiers = [];
    }
  });
  pairs.forEach(([localName, name]) => {
    const newImport = t.importDeclaration(
      [t.importSpecifier(t.identifier(localName), t.identifier(name))],
      t.stringLiteral(getComponentPath(state, name))
    );
    path2.node.body.unshift(newImport);
  });
  nodesToRemove.forEach((node) => path2.node.body.splice(path2.node.body.indexOf(node), 1));
}
function isInsideNodeModules(state) {
  return state.file.opts.filename?.includes("node_modules") && !state.file.replaceWithUnistyles;
}
function addUnistylesRequire(path2, state) {
  Object.entries(state.reactNativeImports).forEach(([componentName, uniqueName]) => {
    const newRequire = t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier(uniqueName),
        t.callExpression(t.identifier("require"), [
          t.stringLiteral(`react-native-unistyles/components/native/${componentName}`)
        ])
      )
    ]);
    path2.node.body.unshift(newRequire);
  });
}

// plugin/src/exotic.ts
function handleExoticImport(path2, state, exoticImport) {
  const specifiers = path2.node.specifiers;
  const source = path2.node.source;
  if (path2.node.importKind !== "value") {
    return;
  }
  specifiers.forEach((specifier) => {
    for (const rule of exoticImport.imports) {
      const hasMatchingImportType = !rule.isDefault && t2.isImportSpecifier(specifier) || rule.isDefault && t2.isImportDefaultSpecifier(specifier);
      const hasMatchingImportName = rule.isDefault || !rule.isDefault && rule.name === specifier.local.name;
      const hasMatchingPath = rule.path === source.value;
      if (!hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
        continue;
      }
      if (t2.isImportDefaultSpecifier(specifier)) {
        const newImport = t2.importDeclaration(
          [t2.importDefaultSpecifier(t2.identifier(specifier.local.name))],
          t2.stringLiteral(getComponentPath(state, rule.mapTo))
        );
        path2.replaceWith(newImport);
      } else {
        const newImport = t2.importDeclaration(
          [t2.importSpecifier(t2.identifier(rule.mapTo), t2.identifier(rule.mapTo))],
          t2.stringLiteral(getComponentPath(state, rule.mapTo))
        );
        path2.node.specifiers = specifiers.filter((s) => s !== specifier);
        if (path2.node.specifiers.length === 0) {
          path2.replaceWith(newImport);
        } else {
          path2.insertBefore(newImport);
        }
      }
      return;
    }
  });
}

// plugin/src/paths.ts
var import_node_path = __toESM(require("node:path"));
var isWindows = process.platform === "win32";
var toWinPath = (pathString) => {
  return import_node_path.default.normalize(pathString).replace(/\//g, "\\");
};
var toPlatformPath = (pathString) => {
  return isWindows ? toWinPath(pathString) : pathString;
};

// plugin/src/ref.ts
var t3 = __toESM(require("@babel/types"));
function hasStringRef(path2) {
  return path2.node.openingElement.attributes.find(
    (attr) => t3.isJSXAttribute(attr) && t3.isJSXIdentifier(attr.name, { name: "ref" }) && t3.isStringLiteral(attr.value)
  );
}

// plugin/src/stylesheet.ts
var t4 = __toESM(require("@babel/types"));
var UnistyleDependency = {
  Theme: 0,
  ThemeName: 1,
  AdaptiveThemes: 2,
  Breakpoints: 3,
  Variants: 4,
  ColorScheme: 5,
  Dimensions: 6,
  Orientation: 7,
  ContentSizeCategory: 8,
  Insets: 9,
  PixelRatio: 10,
  FontScale: 11,
  StatusBar: 12,
  NavigationBar: 13,
  Ime: 14,
  Rtl: 15
};
function getProperty(property) {
  if (!property) {
    return void 0;
  }
  if (t4.isIdentifier(property)) {
    const prop = property;
    return {
      properties: [prop.name]
    };
  }
  if (t4.isObjectPattern(property)) {
    const prop = property;
    const matchingProperties = prop.properties.flatMap((p) => getProperty(p));
    return {
      properties: matchingProperties.flatMap((properties) => properties?.properties).filter((prop2) => prop2 !== void 0)
    };
  }
  if (t4.isObjectProperty(property) && t4.isIdentifier(property.value)) {
    const prop = property.key;
    return {
      properties: [prop.name]
    };
  }
  if (t4.isObjectProperty(property) && t4.isObjectPattern(property.value)) {
    const matchingProperties = property.value.properties.flatMap((p) => getProperty(p));
    const prop = property.key;
    return {
      parent: prop.name,
      properties: matchingProperties.flatMap((properties) => properties?.properties).filter((prop2) => prop2 !== void 0)
    };
  }
  return void 0;
}
function toUnistylesDependency(dependency) {
  switch (dependency) {
    case "theme": {
      return UnistyleDependency.Theme;
    }
    case "themeName": {
      return UnistyleDependency.ThemeName;
    }
    case "adaptiveThemes":
    case "hasAdaptiveThemes": {
      return UnistyleDependency.AdaptiveThemes;
    }
    case "breakpoint": {
      return UnistyleDependency.Breakpoints;
    }
    case "colorScheme": {
      return UnistyleDependency.ColorScheme;
    }
    case "screen": {
      return UnistyleDependency.Dimensions;
    }
    case "isPortrait":
    case "isLandscape": {
      return UnistyleDependency.Orientation;
    }
    case "contentSizeCategory": {
      return UnistyleDependency.ContentSizeCategory;
    }
    case "ime": {
      return UnistyleDependency.Ime;
    }
    case "insets": {
      return UnistyleDependency.Insets;
    }
    case "pixelRatio": {
      return UnistyleDependency.PixelRatio;
    }
    case "fontScale": {
      return UnistyleDependency.FontScale;
    }
    case "statusBar": {
      return UnistyleDependency.StatusBar;
    }
    case "navigationBar": {
      return UnistyleDependency.NavigationBar;
    }
    case "variants": {
      return UnistyleDependency.Variants;
    }
    case "rtl": {
      return UnistyleDependency.Rtl;
    }
    default:
      return null;
  }
}
function getReturnStatementsFromBody(node, results = []) {
  if (t4.isReturnStatement(node)) {
    results.push(node);
  }
  if (t4.isBlockStatement(node)) {
    node.body.forEach((child) => getReturnStatementsFromBody(child, results));
  }
  if (t4.isIfStatement(node)) {
    getReturnStatementsFromBody(node.consequent, results);
    if (node.alternate) {
      getReturnStatementsFromBody(node.alternate, results);
    }
  }
  return results;
}
function isUnistylesStyleSheet(path2, state) {
  const { callee } = path2.node;
  if (!t4.isMemberExpression(callee) || !t4.isIdentifier(callee.property)) {
    return false;
  }
  const isImport = callee.property.name === "create" && t4.isIdentifier(callee.object) && callee.object.name === state.file.styleSheetLocalName;
  const isRequire = state.file.hasUnistylesImport && callee.property.name === "create" && t4.isMemberExpression(callee.object) && t4.isIdentifier(callee.object.property) && t4.isIdentifier(callee.object.object) && callee.object.object.name === state.file.styleSheetLocalName && callee.object.property.name === "StyleSheet";
  return isImport || isRequire;
}
function isUnistylesCommonJSRequire(path2, state) {
  const isRequire = t4.isIdentifier(path2.node.callee) && path2.node.arguments.length > 0 && t4.isStringLiteral(path2.node.arguments[0]) && path2.node.arguments[0].value === "react-native-unistyles";
  if (isRequire && t4.isVariableDeclarator(path2.parent) && t4.isIdentifier(path2.parent.id)) {
    state.file.hasUnistylesImport = true;
    state.file.styleSheetLocalName = path2.parent.id.name;
  }
  return isRequire;
}
function isReactNativeCommonJSRequire(path2, state) {
  const isRequire = t4.isIdentifier(path2.node.callee) && path2.node.arguments.length > 0 && path2.node.callee.name === "require";
  const requireImportName = path2.node.arguments.find((node) => t4.isStringLiteral(node));
  const isReactNativeRequire = isRequire && requireImportName && (requireImportName.value === "react-native" || requireImportName.value === "react-native-web/dist/index");
  if (isReactNativeRequire && t4.isVariableDeclarator(path2.parent) && t4.isIdentifier(path2.parent.id)) {
    state.file.reactNativeCommonJSName = path2.parent.id.name;
  }
  return isRequire;
}
function isKindOfStyleSheet(path2, state) {
  if (!state.file.forceProcessing && !state.file.hasUnistylesImport) {
    return false;
  }
  if (path2.node.arguments.length !== 1) {
    return false;
  }
  const { callee } = path2.node;
  const isCreateCall = t4.isMemberExpression(callee) && t4.isIdentifier(callee.property) && callee.property.name === "create" && (t4.isIdentifier(callee.object) || t4.isMemberExpression(callee.object));
  if (!isCreateCall) {
    return false;
  }
  const argument = path2.node.arguments[0];
  if (t4.isArrowFunctionExpression(argument)) {
    if (argument.params.length > 2) {
      return false;
    }
    if (t4.isObjectExpression(argument.body) && argument.body.properties.length > 0) {
      return true;
    }
    if (t4.isBlockStatement(argument.body)) {
      const returnStatements = getReturnStatementsFromBody(argument.body);
      return returnStatements.some(
        (ret) => ret.argument && t4.isObjectExpression(ret.argument) && ret.argument.properties.length > 0
      );
    }
    return false;
  }
  if (t4.isObjectExpression(argument)) {
    return argument.properties.some(
      (property) => t4.isObjectProperty(property) && t4.isObjectExpression(property.value)
    );
  }
  return false;
}
function getStylesDependenciesFromObject(path2) {
  const detectedStylesWithVariants = /* @__PURE__ */ new Set();
  const stylesheet = path2.node.arguments[0];
  if (t4.isObjectExpression(stylesheet)) {
    stylesheet?.properties.forEach((property) => {
      if (!t4.isObjectProperty(property) || !t4.isIdentifier(property.key)) {
        return;
      }
      if (t4.isObjectProperty(property)) {
        if (t4.isObjectExpression(property.value)) {
          property.value.properties.forEach((innerProp) => {
            if (t4.isObjectProperty(innerProp) && t4.isIdentifier(innerProp.key) && t4.isIdentifier(property.key) && innerProp.key.name === "variants") {
              detectedStylesWithVariants.add({
                label: "variants",
                key: property.key.name
              });
            }
          });
        }
      }
      if (t4.isArrowFunctionExpression(property.value)) {
        if (t4.isObjectExpression(property.value.body)) {
          property.value.body.properties.forEach((innerProp) => {
            if (t4.isObjectProperty(innerProp) && t4.isIdentifier(innerProp.key) && t4.isIdentifier(property.key) && innerProp.key.name === "variants") {
              detectedStylesWithVariants.add({
                label: "variants",
                key: property.key.name
              });
            }
          });
        }
      }
    });
  }
  const variants = Array.from(detectedStylesWithVariants);
  return variants.reduce((acc, { key, label }) => {
    if (acc[key]) {
      acc[key] = [...acc[key], label];
      return acc;
    }
    acc[key] = [label];
    return acc;
  }, {});
}
function getStylesDependenciesFromFunction(funcPath) {
  if (!funcPath) {
    return;
  }
  if (Array.isArray(funcPath)) {
    return;
  }
  if (!t4.isFunctionExpression(funcPath.node) && !t4.isArrowFunctionExpression(funcPath.node)) {
    return;
  }
  const params = funcPath.node.params;
  const [themeParam, rtParam] = params;
  const themeNames = [];
  if (t4.isObjectPattern(themeParam)) {
    for (const prop of themeParam.properties) {
      const property = getProperty(prop);
      if (property) {
        themeNames.push(property);
      }
    }
  }
  if (t4.isIdentifier(themeParam)) {
    themeNames.push({
      properties: [themeParam.name]
    });
  }
  const rtNames = [];
  if (t4.isObjectPattern(rtParam)) {
    for (const prop of rtParam.properties) {
      const property = getProperty(prop);
      if (property) {
        rtNames.push(property);
      }
    }
  }
  if (t4.isIdentifier(rtParam)) {
    rtNames.push({
      properties: [rtParam.name]
    });
  }
  let returnedObjectPath = null;
  if (t4.isObjectExpression(funcPath.node.body)) {
    returnedObjectPath = funcPath.get("body");
  } else {
    funcPath.traverse({
      ReturnStatement(retPath) {
        if (!returnedObjectPath && retPath.get("argument").isObjectExpression()) {
          const argumentPath = retPath.get("argument");
          if (argumentPath.isObjectExpression()) {
            returnedObjectPath = argumentPath;
          }
        }
      }
    });
  }
  if (!returnedObjectPath) {
    return;
  }
  const detectedStylesWithVariants = /* @__PURE__ */ new Set();
  const properties = returnedObjectPath.get("properties");
  properties.forEach((propPath) => {
    const stylePath = propPath.get("key");
    if (Array.isArray(stylePath)) {
      return;
    }
    if (!stylePath.isIdentifier()) {
      return;
    }
    const styleKey = stylePath.node.name;
    const valuePath = propPath.get("value");
    if (Array.isArray(valuePath)) {
      return;
    }
    if (valuePath.isObjectExpression()) {
      const hasVariants = valuePath.get("properties").some((innerProp) => {
        const innerKey = innerProp.get("key");
        if (Array.isArray(innerKey)) {
          return;
        }
        return innerKey.isIdentifier() && innerKey.node.name === "variants";
      });
      if (hasVariants) {
        detectedStylesWithVariants.add({
          label: "variants",
          key: styleKey
        });
      }
    }
    if (valuePath.isArrowFunctionExpression()) {
      if (t4.isObjectExpression(valuePath.node.body)) {
        const hasVariants = valuePath.node.body.properties.some((innerProp) => {
          return t4.isObjectProperty(innerProp) && t4.isIdentifier(innerProp.key) && innerProp.key.name === "variants";
        });
        if (hasVariants) {
          detectedStylesWithVariants.add({
            label: "variants",
            key: styleKey
          });
        }
      }
    }
  });
  const detectedStylesWithTheme = /* @__PURE__ */ new Set();
  themeNames.forEach(({ properties: properties2 }) => {
    properties2.forEach((property) => {
      const binding = funcPath.scope.getBinding(property);
      if (!binding) {
        return;
      }
      binding.referencePaths.forEach((refPath) => {
        const containerProp = refPath.findParent(
          (parent) => parent.isObjectProperty() && parent.parentPath === returnedObjectPath
        );
        if (!containerProp) {
          return;
        }
        const keyNode = containerProp.get("key");
        if (Array.isArray(keyNode)) {
          return;
        }
        const keyValue = keyNode.isLiteral() ? keyNode.isStringLiteral() || keyNode.isNumericLiteral() || keyNode.isBooleanLiteral() ? String(keyNode.node.value) : null : null;
        const styleKey = keyNode.isIdentifier() ? keyNode.node.name : keyValue;
        if (styleKey) {
          detectedStylesWithTheme.add({
            label: "theme",
            key: styleKey
          });
        }
      });
    });
  });
  const detectedStylesWithRt = /* @__PURE__ */ new Set();
  const localRtName = t4.isIdentifier(rtParam) ? rtParam.name : void 0;
  rtNames.forEach(({ properties: properties2, parent }) => {
    properties2.forEach((property) => {
      const rtBinding = funcPath.scope.getBinding(property);
      if (!rtBinding) {
        return;
      }
      const isValidDependency = Boolean(toUnistylesDependency(property));
      let validRtName = property;
      if (!isValidDependency && (!localRtName || localRtName && localRtName !== property)) {
        if (!parent) {
          return;
        }
        if (!toUnistylesDependency(parent)) {
          return;
        }
        validRtName = parent;
      }
      rtBinding.referencePaths.forEach((refPath) => {
        let usedLabel = validRtName;
        if (refPath.parentPath?.isMemberExpression() && refPath.parentPath.get("object") === refPath) {
          const memberExpr = refPath.parentPath;
          const propPath = memberExpr.get("property");
          if (propPath.isIdentifier()) {
            if (localRtName) {
              usedLabel = propPath.node.name;
            }
            if (usedLabel === "insets" && memberExpr.parentPath.isMemberExpression() && memberExpr.parentPath.get("object") === memberExpr) {
              const secondPropPath = memberExpr.parentPath.get("property");
              if (secondPropPath.isIdentifier() && secondPropPath.node.name === "ime") {
                usedLabel = "ime";
              }
            }
            if (usedLabel === "insets" && (memberExpr.parentPath.isBinaryExpression() || memberExpr.parentPath.isLogicalExpression())) {
              const secondPropPath = memberExpr.node.property;
              if (t4.isIdentifier(secondPropPath) && secondPropPath.name === "ime") {
                usedLabel = "ime";
              }
            }
          }
        }
        const containerProp = refPath.findParent(
          (parent2) => parent2.isObjectProperty() && parent2.parentPath === returnedObjectPath
        );
        if (!containerProp) {
          return;
        }
        const keyNode = containerProp.get("key");
        if (Array.isArray(keyNode)) {
          return;
        }
        const keyValue = keyNode.isLiteral() ? keyNode.isStringLiteral() || keyNode.isNumericLiteral() || keyNode.isBooleanLiteral() ? String(keyNode.node.value) : null : null;
        const styleKey = keyNode.isIdentifier() ? keyNode.node.name : keyValue;
        if (styleKey) {
          detectedStylesWithRt.add({
            label: usedLabel,
            key: styleKey
          });
        }
      });
    });
  });
  const variants = Array.from(detectedStylesWithVariants);
  const theme = Array.from(detectedStylesWithTheme);
  const rt = Array.from(detectedStylesWithRt);
  return theme.concat(rt).concat(variants).reduce((acc, { key, label }) => {
    if (acc[key]) {
      acc[key] = [...acc[key], label];
      return acc;
    }
    acc[key] = [label];
    return acc;
  }, {});
}
function addDependencies(state, styleName, unistyle, detectedDependencies) {
  const debugMessage = (deps) => {
    if (state.opts.debug) {
      const mappedDeps = deps.map(
        (dep) => Object.keys(UnistyleDependency).find(
          (key) => UnistyleDependency[key] === dep
        )
      ).join(", ");
      console.log(
        `${state.filename?.replace(`${state.file.opts.root}/`, "")}: styles.${styleName}: [${mappedDeps}]`
      );
    }
  };
  const styleDependencies = detectedDependencies.map(toUnistylesDependency);
  if (styleDependencies.length > 0) {
    const uniqueDependencies = Array.from(new Set(styleDependencies));
    debugMessage(uniqueDependencies);
    let targets = [];
    if (t4.isArrowFunctionExpression(unistyle.value) || t4.isFunctionExpression(unistyle.value)) {
      if (t4.isObjectExpression(unistyle.value.body)) {
        targets.push(unistyle.value.body);
      }
      if (t4.isBlockStatement(unistyle.value.body)) {
        targets = getReturnStatementsFromBody(unistyle.value.body).map((node) => {
          if (t4.isIdentifier(node.argument)) {
            node.argument = t4.objectExpression([t4.spreadElement(node.argument)]);
          }
          return node.argument;
        }).filter((node) => t4.isObjectExpression(node));
      }
    }
    if (t4.isObjectExpression(unistyle.value)) {
      targets.push(unistyle.value);
    }
    if (t4.isMemberExpression(unistyle.value)) {
      unistyle.value = t4.objectExpression([t4.spreadElement(unistyle.value)]);
      targets.push(unistyle.value);
    }
    if (targets.length > 0) {
      targets.forEach((target) => {
        target.properties.push(
          t4.objectProperty(
            t4.identifier("uni__dependencies"),
            t4.arrayExpression(
              uniqueDependencies.filter((dep) => dep !== void 0 && dep !== null).map((dep) => t4.numericLiteral(dep))
            )
          )
        );
      });
    }
  }
}

// plugin/src/variants.ts
var t5 = __toESM(require("@babel/types"));
function extractVariants(path2, state) {
  const maybeVariants = path2.node.body.filter(
    (node2) => t5.isExpressionStatement(node2) && t5.isCallExpression(node2.expression) && t5.isMemberExpression(node2.expression.callee)
  );
  if (maybeVariants.length === 0) {
    return;
  }
  const targetVariant = maybeVariants.find((variant) => {
    if (!t5.isExpressionStatement(variant) || !t5.isCallExpression(variant.expression) || !t5.isMemberExpression(variant.expression.callee) || !t5.isIdentifier(variant.expression.callee.object)) {
      return false;
    }
    const calleeName2 = variant.expression.callee.object.name;
    return t5.isIdentifier(variant.expression.callee.object, { name: calleeName2 }) && t5.isIdentifier(variant.expression.callee.property, { name: "useVariants" }) && variant.expression.arguments.length === 1;
  });
  if (!targetVariant) {
    return;
  }
  const node = targetVariant.expression;
  if (!t5.isCallExpression(node)) {
    return;
  }
  const callee = node.callee;
  if (!t5.isMemberExpression(callee) || !t5.isIdentifier(callee.object)) {
    return;
  }
  const calleeName = callee.object.name;
  const newUniqueName = path2.scope.generateUidIdentifier(calleeName);
  const shadowDeclaration = t5.variableDeclaration("const", [
    t5.variableDeclarator(newUniqueName, t5.identifier(calleeName))
  ]);
  const newCallExpression = t5.callExpression(
    t5.memberExpression(t5.identifier(newUniqueName.name), t5.identifier("useVariants")),
    node.arguments
  );
  const finalDeclaration = t5.variableDeclaration("const", [
    t5.variableDeclarator(t5.identifier(calleeName), newCallExpression)
  ]);
  const pathIndex = path2.node.body.findIndex((bodyPath) => bodyPath === targetVariant);
  const rest = path2.node.body.slice(pathIndex + 1);
  const statement = t5.blockStatement([finalDeclaration, ...rest]);
  path2.node.body = [...path2.node.body.slice(0, pathIndex), shadowDeclaration, statement];
  state.file.hasVariants = true;
}

// plugin/src/index.ts
function index_default() {
  if (process.env.NODE_ENV === "test") {
    return {
      name: "babel-react-native-unistyles",
      visitor: {}
    };
  }
  return {
    name: "babel-react-native-unistyles",
    visitor: {
      Program: {
        enter(path2, state) {
          if (!state.opts.root) {
            throw new Error(
              "Unistyles \u{1F984}: Babel plugin requires `root` option to be set. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration"
            );
          }
          const appRoot = toPlatformPath(import_node_path2.default.join(state.file.opts.root, state.opts.root));
          if (state.file.opts.root === appRoot) {
            throw new Error(
              "Unistyles \u{1F984}: Root option can't resolve to project root as it will include node_modules folder. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration"
            );
          }
          state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS.concat(
            state.opts.autoProcessPaths ?? []
          ).map(toPlatformPath).some((path3) => state.filename?.includes(path3));
          state.file.hasAnyUnistyle = false;
          state.file.hasUnistylesImport = false;
          state.file.addUnistylesRequire = false;
          state.file.hasVariants = false;
          state.file.styleSheetLocalName = "";
          state.file.reactNativeCommonJSName = "";
          state.reactNativeImports = {};
          state.file.forceProcessing = state.filename?.includes(appRoot) ?? false;
          path2.traverse({
            BlockStatement(blockPath) {
              if (isInsideNodeModules(state)) {
                return;
              }
              extractVariants(blockPath, state);
            }
          });
        },
        exit(path2, state) {
          if (isInsideNodeModules(state)) {
            return;
          }
          if (state.file.addUnistylesRequire) {
            return addUnistylesRequire(path2, state);
          }
          if (state.file.hasAnyUnistyle || state.file.hasVariants || state.file.replaceWithUnistyles || state.file.forceProcessing) {
            addUnistylesImport(path2, state);
          }
        }
      },
      FunctionDeclaration(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path2.node.id ? path2.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      ClassDeclaration(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path2.node.id ? path2.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      VariableDeclaration(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        path2.node.declarations.forEach((declaration) => {
          if (t6.isArrowFunctionExpression(declaration.init) || t6.isFunctionExpression(declaration.init)) {
            const componentName = declaration.id && t6.isIdentifier(declaration.id) ? declaration.id.name : null;
            if (componentName) {
              state.file.hasVariants = false;
            }
          }
        });
      },
      ImportDeclaration(path2, state) {
        const exoticImport = REPLACE_WITH_UNISTYLES_EXOTIC_PATHS.concat(state.opts.autoRemapImports ?? []).find(
          (exotic) => state.filename?.includes(exotic.path)
        );
        if (exoticImport) {
          return handleExoticImport(path2, state, exoticImport);
        }
        if (isInsideNodeModules(state)) {
          return;
        }
        const importSource = path2.node.source.value;
        if (importSource.includes("react-native-unistyles")) {
          state.file.hasUnistylesImport = true;
          path2.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && specifier.imported.name === "StyleSheet") {
              state.file.styleSheetLocalName = specifier.local.name;
            }
          });
        }
        if (importSource === "react-native") {
          path2.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && REACT_NATIVE_COMPONENT_NAMES.includes(specifier.imported.name)) {
              state.reactNativeImports[specifier.local.name] = specifier.imported.name;
            }
          });
        }
        if (importSource.includes("react-native/Libraries")) {
          handleExoticImport(path2, state, NATIVE_COMPONENTS_PATHS);
        }
        if (!state.file.forceProcessing && Array.isArray(state.opts.autoProcessImports)) {
          state.file.forceProcessing = state.opts.autoProcessImports.includes(importSource);
        }
      },
      JSXElement(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (hasStringRef(path2)) {
          throw new Error("Detected string based ref which is not supported by Unistyles.");
        }
      },
      MemberExpression(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (!state.file.reactNativeCommonJSName || !t6.isIdentifier(path2.node.object)) {
          return;
        }
        if (path2.node.object.name !== state.file.reactNativeCommonJSName || !t6.isIdentifier(path2.node.property)) {
          return;
        }
        if (!REACT_NATIVE_COMPONENT_NAMES.includes(path2.node.property.name)) {
          return;
        }
        if (!state.reactNativeImports[path2.node.property.name]) {
          const uniqueId = path2.scope.generateUidIdentifier(`reactNativeUnistyles_${path2.node.property.name}`);
          state.reactNativeImports[path2.node.property.name] = uniqueId.name;
          state.file.addUnistylesRequire = true;
        }
        path2.node.object.name = state.reactNativeImports[path2.node.property.name];
      },
      CallExpression(path2, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (isUnistylesCommonJSRequire(path2, state)) {
          return;
        }
        if (isReactNativeCommonJSRequire(path2, state)) {
          return;
        }
        if (!isUnistylesStyleSheet(path2, state) && !isKindOfStyleSheet(path2, state)) {
          return;
        }
        state.file.hasAnyUnistyle = true;
        const arg = t6.isAssignmentExpression(path2.node.arguments[0]) ? path2.node.arguments[0].right : path2.node.arguments[0];
        if (t6.isObjectExpression(arg)) {
          const detectedDependencies = getStylesDependenciesFromObject(path2);
          if (detectedDependencies) {
            if (t6.isObjectExpression(arg)) {
              arg.properties.forEach((property) => {
                if (t6.isObjectProperty(property) && t6.isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                  addDependencies(
                    state,
                    property.key.name,
                    property,
                    detectedDependencies[property.key.name] ?? []
                  );
                }
              });
            }
          }
        }
        if (t6.isArrowFunctionExpression(arg) || t6.isFunctionExpression(arg)) {
          const funcPath = t6.isAssignmentExpression(path2.node.arguments[0]) ? path2.get("arguments.0.right") : path2.get("arguments.0");
          const detectedDependencies = getStylesDependenciesFromFunction(funcPath);
          if (detectedDependencies) {
            const body = t6.isBlockStatement(arg.body) ? arg.body.body.find((statement) => t6.isReturnStatement(statement))?.argument : arg.body;
            if (t6.isObjectExpression(body)) {
              body.properties.forEach((property) => {
                if (t6.isObjectProperty(property) && t6.isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                  addDependencies(
                    state,
                    property.key.name,
                    property,
                    detectedDependencies[property.key.name] ?? []
                  );
                }
              });
            }
          }
        }
      }
    }
  };
}
