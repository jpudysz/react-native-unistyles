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

// metro/src/babel-transformer.ts
var babel_transformer_exports = {};
__export(babel_transformer_exports, {
  getCacheKey: () => getCacheKey,
  transform: () => transform
});
module.exports = __toCommonJS(babel_transformer_exports);
var import_node_fs = __toESM(require("node:fs"));
var import_node_path4 = __toESM(require("node:path"));

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
    },
    {
      name: "unstable_NativeText",
      isDefault: false,
      path: "react-native",
      mapTo: "NativeText"
    },
    {
      name: "unstable_NativeView",
      isDefault: false,
      path: "react-native",
      mapTo: "NativeView"
    }
  ]
};
var METRO_UPSTREAM_TRANSFORMER_ENV = "UNISTYLES_METRO_UPSTREAM_TRANSFORMER";
var METRO_OPTIONS_ENV = "UNISTYLES_METRO_OPTIONS";

// metro/src/transformer.ts
var import_node_path3 = __toESM(require("node:path"));

// plugin/src/index.ts
var t6 = __toESM(require("@babel/types"));
var import_node_path2 = __toESM(require("node:path"));

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
function addUnistylesImport(path3, state) {
  const localNames = Object.keys(state.reactNativeImports);
  const names = Object.values(state.reactNativeImports);
  const pairs = Object.entries(state.reactNativeImports);
  const nodesToRemove = [];
  path3.node.body.forEach((node) => {
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
    const rnWebImport = path3.node.body.find(
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
    path3.node.body.unshift(newImport);
  });
  nodesToRemove.forEach((node) => path3.node.body.splice(path3.node.body.indexOf(node), 1));
}
function isInsideNodeModules(state) {
  if (state.opts.isMetro) {
    return false;
  }
  return state.file.opts.filename?.includes("node_modules") && !state.file.replaceWithUnistyles;
}
function addUnistylesRequire(path3, state) {
  Object.entries(state.reactNativeImports).forEach(([componentName, uniqueName]) => {
    const newRequire = t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier(uniqueName),
        t.callExpression(t.identifier("require"), [
          t.stringLiteral(`react-native-unistyles/components/native/${componentName}`)
        ])
      )
    ]);
    path3.node.body.unshift(newRequire);
  });
}

// plugin/src/exotic.ts
function handleExoticImport(path3, state, exoticImport) {
  const specifiers = path3.node.specifiers;
  const source = path3.node.source;
  if (path3.node.importKind !== "value") {
    return;
  }
  specifiers.forEach((specifier) => {
    for (const rule of exoticImport.imports) {
      const hasMatchingImportType = !rule.isDefault && t2.isImportSpecifier(specifier) || rule.isDefault && t2.isImportDefaultSpecifier(specifier);
      const isTypeOnly = t2.isImportSpecifier(specifier) && specifier.importKind !== "value";
      const hasMatchingImportName = rule.isDefault || t2.isImportSpecifier(specifier) && rule.name === getImportedName(specifier);
      const hasMatchingPath = rule.path === source.value;
      if (isTypeOnly || !hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
        continue;
      }
      if (t2.isImportDefaultSpecifier(specifier)) {
        const newImport = t2.importDeclaration(
          [t2.importDefaultSpecifier(t2.identifier(specifier.local.name))],
          t2.stringLiteral(getComponentPath(state, rule.mapTo))
        );
        path3.replaceWith(newImport);
      } else {
        const newImport = t2.importDeclaration(
          [t2.importSpecifier(t2.identifier(specifier.local.name), t2.identifier(rule.mapTo))],
          t2.stringLiteral(getComponentPath(state, rule.mapTo))
        );
        path3.node.specifiers = path3.node.specifiers.filter((s) => s !== specifier);
        if (path3.node.specifiers.length === 0) {
          path3.replaceWith(newImport);
        } else {
          path3.insertBefore(newImport);
        }
      }
      return;
    }
  });
}
function getImportedName(specifier) {
  return t2.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value;
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
function hasStringRef(path3) {
  return path3.node.openingElement.attributes.find(
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
function getStyleKeyName(key) {
  if (!key) {
    return null;
  }
  if (t4.isIdentifier(key)) {
    return key.name;
  }
  if (t4.isStringLiteral(key) || t4.isNumericLiteral(key) || t4.isBooleanLiteral(key)) {
    return String(key.value);
  }
  return null;
}
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
function isUnistylesStyleSheet(path3, state) {
  const { callee } = path3.node;
  if (!t4.isMemberExpression(callee) || !t4.isIdentifier(callee.property)) {
    return false;
  }
  const isImport = callee.property.name === "create" && t4.isIdentifier(callee.object) && callee.object.name === state.file.styleSheetLocalName;
  const isRequire = state.file.hasUnistylesImport && callee.property.name === "create" && t4.isMemberExpression(callee.object) && t4.isIdentifier(callee.object.property) && t4.isIdentifier(callee.object.object) && callee.object.object.name === state.file.styleSheetLocalName && callee.object.property.name === "StyleSheet";
  return isImport || isRequire;
}
function isUnistylesCommonJSRequire(path3, state) {
  const isRequire = t4.isIdentifier(path3.node.callee) && path3.node.arguments.length > 0 && t4.isStringLiteral(path3.node.arguments[0]) && path3.node.arguments[0].value === "react-native-unistyles";
  if (isRequire && t4.isVariableDeclarator(path3.parent) && t4.isIdentifier(path3.parent.id)) {
    state.file.hasUnistylesImport = true;
    state.file.styleSheetLocalName = path3.parent.id.name;
  }
  return isRequire;
}
function isReactNativeCommonJSRequire(path3, state) {
  const isRequire = t4.isIdentifier(path3.node.callee) && path3.node.arguments.length > 0 && path3.node.callee.name === "require";
  const requireImportName = path3.node.arguments.find((node) => t4.isStringLiteral(node));
  const isReactNativeRequire = isRequire && requireImportName && (requireImportName.value === "react-native" || requireImportName.value === "react-native-web/dist/index");
  if (isReactNativeRequire && t4.isVariableDeclarator(path3.parent) && t4.isIdentifier(path3.parent.id)) {
    state.file.reactNativeCommonJSName = path3.parent.id.name;
  }
  return isRequire;
}
function isKindOfStyleSheet(path3, state) {
  if (!state.file.forceProcessing && !state.file.hasUnistylesImport) {
    return false;
  }
  if (path3.node.arguments.length !== 1) {
    return false;
  }
  const { callee } = path3.node;
  const isCreateCall = t4.isMemberExpression(callee) && t4.isIdentifier(callee.property) && callee.property.name === "create" && (t4.isIdentifier(callee.object) || t4.isMemberExpression(callee.object));
  if (!isCreateCall) {
    return false;
  }
  const argument = path3.node.arguments[0];
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
function getStylesDependenciesFromObject(path3) {
  const detectedStylesWithVariants = /* @__PURE__ */ new Set();
  const stylesheet = path3.node.arguments[0];
  if (t4.isObjectExpression(stylesheet)) {
    stylesheet?.properties.forEach((property) => {
      if (!t4.isObjectProperty(property)) {
        return;
      }
      const styleKey = getStyleKeyName(property.key);
      if (!styleKey) {
        return;
      }
      if (t4.isObjectExpression(property.value)) {
        property.value.properties.forEach((innerProp) => {
          if (t4.isObjectProperty(innerProp) && t4.isIdentifier(innerProp.key) && innerProp.key.name === "variants") {
            detectedStylesWithVariants.add({
              label: "variants",
              key: styleKey
            });
          }
        });
      }
      if (t4.isArrowFunctionExpression(property.value)) {
        if (t4.isObjectExpression(property.value.body)) {
          property.value.body.properties.forEach((innerProp) => {
            if (t4.isObjectProperty(innerProp) && t4.isIdentifier(innerProp.key) && innerProp.key.name === "variants") {
              detectedStylesWithVariants.add({
                label: "variants",
                key: styleKey
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
    const styleKey = getStyleKeyName(stylePath.node);
    if (!styleKey) {
      return;
    }
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
var scopedVariants = /* @__PURE__ */ new WeakMap();
function extractVariants(path3, state) {
  const maybeVariants = path3.node.body.filter(
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
  const binding = path3.scope.getBinding(calleeName);
  const existingShadowName = binding && t5.isVariableDeclarator(binding.path.node) ? scopedVariants.get(binding.path.node) : void 0;
  const shadowName = existingShadowName ?? path3.scope.generateUidIdentifier(calleeName).name;
  const newCallExpression = t5.callExpression(
    t5.memberExpression(t5.identifier(shadowName), t5.identifier("useVariants")),
    node.arguments
  );
  const finalDeclarator = t5.variableDeclarator(t5.identifier(calleeName), newCallExpression);
  const finalDeclaration = t5.variableDeclaration("const", [finalDeclarator]);
  scopedVariants.set(finalDeclarator, shadowName);
  const pathIndex = path3.node.body.findIndex((bodyPath) => bodyPath === targetVariant);
  const rest = path3.node.body.slice(pathIndex + 1);
  const statement = t5.blockStatement([finalDeclaration, ...rest]);
  state.file.hasVariants = true;
  if (existingShadowName) {
    path3.node.body = [...path3.node.body.slice(0, pathIndex), statement];
    return;
  }
  const shadowDeclaration = t5.variableDeclaration("const", [
    t5.variableDeclarator(t5.identifier(shadowName), t5.identifier(calleeName))
  ]);
  path3.node.body = [...path3.node.body.slice(0, pathIndex), shadowDeclaration, statement];
  path3.scope.registerDeclaration(path3.get(`body.${pathIndex}`));
}

// plugin/src/index.ts
function src_default() {
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
        enter(path3, state) {
          if (!state.opts.isMetro && process.env[METRO_UPSTREAM_TRANSFORMER_ENV]) {
            throw new Error(
              "Unistyles \u{1F984}: react-native-unistyles/metro is enabled in metro.config.js, remove react-native-unistyles/plugin from babel.config.js"
            );
          }
          if (!state.opts.root && !state.opts.isMetro) {
            throw new Error(
              "Unistyles \u{1F984}: Babel plugin requires `root` option to be set. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration"
            );
          }
          const appRoot = toPlatformPath(import_node_path2.default.join(state.file.opts.root, state.opts.root ?? ""));
          if (!state.opts.isMetro && state.file.opts.root === appRoot) {
            throw new Error(
              "Unistyles \u{1F984}: Root option can't resolve to project root as it will include node_modules folder. Please check https://www.unistyl.es/v3/other/babel-plugin#extra-configuration"
            );
          }
          state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS.concat(
            state.opts.autoProcessPaths ?? []
          ).map(toPlatformPath).some((path4) => state.filename?.includes(path4));
          state.file.hasAnyUnistyle = false;
          state.file.hasUnistylesImport = false;
          state.file.addUnistylesRequire = false;
          state.file.hasVariants = false;
          state.file.styleSheetLocalName = "";
          state.file.reactNativeCommonJSName = "";
          state.reactNativeImports = {};
          state.file.forceProcessing = state.opts.isMetro || (state.filename?.includes(appRoot) ?? false);
          path3.traverse({
            BlockStatement(blockPath) {
              if (isInsideNodeModules(state)) {
                return;
              }
              extractVariants(blockPath, state);
            }
          });
        },
        exit(path3, state) {
          if (state.opts.isMetro || isInsideNodeModules(state)) {
            return;
          }
          if (state.file.addUnistylesRequire) {
            return addUnistylesRequire(path3, state);
          }
          if (state.file.hasAnyUnistyle || state.file.hasVariants || state.file.replaceWithUnistyles || state.file.forceProcessing) {
            addUnistylesImport(path3, state);
          }
        }
      },
      FunctionDeclaration(path3, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path3.node.id ? path3.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      ClassDeclaration(path3, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path3.node.id ? path3.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      VariableDeclaration(path3, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        path3.node.declarations.forEach((declaration) => {
          if (t6.isArrowFunctionExpression(declaration.init) || t6.isFunctionExpression(declaration.init)) {
            const componentName = declaration.id && t6.isIdentifier(declaration.id) ? declaration.id.name : null;
            if (componentName) {
              state.file.hasVariants = false;
            }
          }
        });
      },
      ImportDeclaration(path3, state) {
        const exoticImport = state.opts.isMetro ? void 0 : REPLACE_WITH_UNISTYLES_EXOTIC_PATHS.concat(state.opts.autoRemapImports ?? []).find(
          (exotic) => state.filename?.includes(exotic.path)
        );
        if (exoticImport) {
          return handleExoticImport(path3, state, exoticImport);
        }
        if (isInsideNodeModules(state)) {
          return;
        }
        const importSource = path3.node.source.value;
        if (importSource.includes("react-native-unistyles")) {
          state.file.hasUnistylesImport = true;
          path3.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && specifier.imported.name === "StyleSheet") {
              state.file.styleSheetLocalName = specifier.local.name;
            }
          });
        }
        if (state.opts.isMetro) {
          return;
        }
        if (importSource === "react-native") {
          path3.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && REACT_NATIVE_COMPONENT_NAMES.includes(specifier.imported.name)) {
              state.reactNativeImports[specifier.local.name] = specifier.imported.name;
            }
          });
        }
        if (importSource === "react-native" || importSource.includes("react-native/Libraries")) {
          handleExoticImport(path3, state, NATIVE_COMPONENTS_PATHS);
        }
        if (!state.file.forceProcessing && Array.isArray(state.opts.autoProcessImports)) {
          state.file.forceProcessing = state.opts.autoProcessImports.includes(importSource);
        }
      },
      JSXElement(path3, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (hasStringRef(path3)) {
          throw new Error("Detected string based ref which is not supported by Unistyles.");
        }
      },
      MemberExpression(path3, state) {
        if (state.opts.isMetro || isInsideNodeModules(state)) {
          return;
        }
        if (!state.file.reactNativeCommonJSName || !t6.isIdentifier(path3.node.object)) {
          return;
        }
        if (path3.node.object.name !== state.file.reactNativeCommonJSName || !t6.isIdentifier(path3.node.property)) {
          return;
        }
        if (!REACT_NATIVE_COMPONENT_NAMES.includes(path3.node.property.name)) {
          return;
        }
        if (!state.reactNativeImports[path3.node.property.name]) {
          const uniqueId = path3.scope.generateUidIdentifier(`reactNativeUnistyles_${path3.node.property.name}`);
          state.reactNativeImports[path3.node.property.name] = uniqueId.name;
          state.file.addUnistylesRequire = true;
        }
        path3.node.object.name = state.reactNativeImports[path3.node.property.name];
      },
      CallExpression(path3, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (isUnistylesCommonJSRequire(path3, state)) {
          return;
        }
        if (isReactNativeCommonJSRequire(path3, state)) {
          return;
        }
        if (!isUnistylesStyleSheet(path3, state) && !isKindOfStyleSheet(path3, state)) {
          return;
        }
        state.file.hasAnyUnistyle = true;
        const arg = t6.isAssignmentExpression(path3.node.arguments[0]) ? path3.node.arguments[0].right : path3.node.arguments[0];
        if (t6.isObjectExpression(arg)) {
          const detectedDependencies = getStylesDependenciesFromObject(path3);
          if (detectedDependencies) {
            if (t6.isObjectExpression(arg)) {
              arg.properties.forEach((property) => {
                if (!t6.isObjectProperty(property)) {
                  return;
                }
                const styleKey = getStyleKeyName(property.key);
                if (styleKey && Object.prototype.hasOwnProperty.call(detectedDependencies, styleKey)) {
                  addDependencies(state, styleKey, property, detectedDependencies[styleKey] ?? []);
                }
              });
            }
          }
        }
        if (t6.isArrowFunctionExpression(arg) || t6.isFunctionExpression(arg)) {
          const funcPath = t6.isAssignmentExpression(path3.node.arguments[0]) ? path3.get("arguments.0.right") : path3.get("arguments.0");
          const detectedDependencies = getStylesDependenciesFromFunction(funcPath);
          if (detectedDependencies) {
            const body = t6.isBlockStatement(arg.body) ? arg.body.body.find((statement) => t6.isReturnStatement(statement))?.argument : arg.body;
            if (t6.isObjectExpression(body)) {
              body.properties.forEach((property) => {
                if (!t6.isObjectProperty(property)) {
                  return;
                }
                const styleKey = getStyleKeyName(property.key);
                if (styleKey && Object.prototype.hasOwnProperty.call(detectedDependencies, styleKey)) {
                  addDependencies(state, styleKey, property, detectedDependencies[styleKey] ?? []);
                }
              });
            }
          }
        }
      }
    }
  };
}

// metro/src/transformer.ts
var MAYBE_UNISTYLES = /\.create\s*\(|\.useVariants\s*\(/;
var createBabelTransformer = ({ upstream, options, unistylesRoot, path: path3 = import_node_path3.default }) => {
  const pluginItem = [src_default, { debug: options.debug, isMetro: true }, "react-native-unistyles"];
  const shouldProcess = ({ filename, src, options: { projectRoot } }) => {
    if (!MAYBE_UNISTYLES.test(src)) {
      return false;
    }
    const filePath = path3.resolve(projectRoot, filename);
    if (filePath.startsWith(`${unistylesRoot}${path3.sep}`)) {
      return false;
    }
    return !filePath.includes(`${path3.sep}node_modules${path3.sep}`) || src.includes("react-native-unistyles");
  };
  const transform2 = (args) => {
    if (!shouldProcess(args)) {
      return upstream.transform(args);
    }
    return upstream.transform({
      ...args,
      plugins: [...args.plugins ?? [], pluginItem]
    });
  };
  const getCacheKey2 = (...args) => upstream.getCacheKey?.(...args) ?? "";
  return { shouldProcess, transform: transform2, getCacheKey: getCacheKey2 };
};

// metro/src/babel-transformer.ts
var upstreamPath = process.env[METRO_UPSTREAM_TRANSFORMER_ENV];
if (!upstreamPath) {
  throw new Error(
    "Unistyles \u{1F984}: react-native-unistyles/metro/babel-transformer can be only set by withUnistylesConfig in metro.config.js"
  );
}
var { transform, getCacheKey } = createBabelTransformer({
  upstream: require(upstreamPath),
  options: JSON.parse(process.env[METRO_OPTIONS_ENV] ?? "{}"),
  unistylesRoot: import_node_fs.default.realpathSync(import_node_path4.default.join(__dirname, ".."))
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getCacheKey,
  transform
});
