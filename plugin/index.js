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
  "Animated"
  // Modal - there is no exposed native handle
  // TouchableWithoutFeedback - can't accept a ref
];
var REPLACE_WITH_UNISTYLES_PATHS = [
  "react-native-reanimated/src/component",
  "react-native-reanimated/lib/module/component",
  "react-native-gesture-handler/lib/module/components",
  "react-native-gesture-handler/lib/commonjs/components",
  "react-native-gesture-handler/src/components"
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
var t = __toESM(require("@babel/types"));
function handleExoticImport(path, state, exoticImport) {
  const specifiers = path.node.specifiers;
  const source = path.node.source;
  if (path.node.importKind !== "value") {
    return;
  }
  specifiers.forEach((specifier) => {
    for (const rule of exoticImport.imports) {
      const hasMatchingImportType = !rule.isDefault && t.isImportSpecifier(specifier) || rule.isDefault && t.isImportDefaultSpecifier(specifier);
      const hasMatchingImportName = rule.isDefault || !rule.isDefault && rule.name === specifier.local.name;
      const hasMatchingPath = rule.path === source.value;
      if (!hasMatchingImportType || !hasMatchingImportName || !hasMatchingPath) {
        continue;
      }
      if (t.isImportDefaultSpecifier(specifier)) {
        const newImport = t.importDeclaration(
          [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
          t.stringLiteral(
            state.opts.isLocal ? state.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/components/native/${rule.mapTo}`) ?? "" : `react-native-unistyles/components/native/${rule.mapTo}`
          )
        );
        path.replaceWith(newImport);
      } else {
        const newImport = t.importDeclaration(
          [t.importSpecifier(t.identifier(rule.mapTo), t.identifier(rule.mapTo))],
          t.stringLiteral(
            state.opts.isLocal ? state.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/components/native/${rule.mapTo}`) ?? "" : `react-native-unistyles/components/native/${rule.mapTo}`
          )
        );
        path.node.specifiers = specifiers.filter((s) => s !== specifier);
        if (path.node.specifiers.length === 0) {
          path.replaceWith(newImport);
        } else {
          path.insertBefore(newImport);
        }
      }
      return;
    }
  });
}

// plugin/src/import.ts
var t2 = __toESM(require("@babel/types"));
function addUnistylesImport(path, state) {
  const localNames = Object.keys(state.reactNativeImports);
  const names = Object.values(state.reactNativeImports);
  const pairs = Object.entries(state.reactNativeImports);
  const nodesToRemove = [];
  path.node.body.forEach((node) => {
    if (t2.isImportDeclaration(node) && node.source.value === "react-native") {
      node.specifiers = node.specifiers.filter((specifier) => !localNames.some((name) => name === specifier.local.name));
      if (node.specifiers.length === 0) {
        nodesToRemove.push(node);
      }
    }
  });
  names.forEach((name) => {
    const rnWebImport = path.node.body.find((node) => t2.isImportDeclaration(node) && node.source.value === `react-native-web/dist/exports/${name}`);
    if (rnWebImport) {
      rnWebImport.specifiers = [];
    }
  });
  pairs.forEach(([localName, name]) => {
    const newImport = t2.importDeclaration(
      [t2.importSpecifier(t2.identifier(localName), t2.identifier(name))],
      t2.stringLiteral(
        state.opts.isLocal ? state.file.opts.filename?.split("react-native-unistyles").at(0)?.concat(`react-native-unistyles/src/components/native/${name}`) ?? "" : `react-native-unistyles/components/native/${name}`
      )
    );
    path.node.body.unshift(newImport);
  });
  nodesToRemove.forEach((node) => path.node.body.splice(path.node.body.indexOf(node), 1));
}
function isInsideNodeModules(state) {
  return state.file.opts.filename?.includes("node_modules");
}

// plugin/src/ref.ts
var t3 = __toESM(require("@babel/types"));
function hasStringRef(path) {
  return path.node.openingElement.attributes.find(
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
  Ime: 14
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
    case "adaptiveThemes": {
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
function stringToUniqueId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  return absHash % 1e9;
}
function isUnistylesStyleSheet(path, state) {
  const { callee } = path.node;
  if (t4.isMemberExpression(callee) && t4.isIdentifier(callee.property)) {
    return callee.property.name === "create" && t4.isIdentifier(callee.object) && callee.object.name === state.file.styleSheetLocalName;
  }
  return false;
}
function isKindOfStyleSheet(path, state) {
  if (!state.file.forceProcessing && !state.file.hasUnistylesImport) {
    return false;
  }
  const { callee } = path.node;
  return t4.isMemberExpression(callee) && t4.isIdentifier(callee.property) && callee.property.name === "create" && t4.isIdentifier(callee.object);
}
function addStyleSheetTag(path, state) {
  const str = state.filename?.replace(state.cwd, "") ?? "";
  const uniqueId = stringToUniqueId(str) + ++state.file.tagNumber;
  path.node.arguments.push(t4.numericLiteral(uniqueId));
}
function getStylesDependenciesFromObject(path) {
  const detectedStylesWithVariants = /* @__PURE__ */ new Set();
  const stylesheet = path.node.arguments[0];
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
      acc[key] = [
        ...acc[key],
        label
      ];
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
        const containerProp = refPath.findParent((parent) => parent.isObjectProperty() && parent.parentPath === returnedObjectPath);
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
        const containerProp = refPath.findParent((parent2) => parent2.isObjectProperty() && parent2.parentPath === returnedObjectPath);
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
      acc[key] = [
        ...acc[key],
        label
      ];
      return acc;
    }
    acc[key] = [label];
    return acc;
  }, {});
}
function addDependencies(state, styleName, unistyle, detectedDependencies) {
  const debugMessage = (deps) => {
    if (state.opts.debug) {
      const mappedDeps = deps.map((dep) => Object.keys(UnistyleDependency).find((key) => UnistyleDependency[key] === dep)).join(", ");
      console.log(`${state.filename?.replace(`${state.file.opts.root}/`, "")}: styles.${styleName}: [${mappedDeps}]`);
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
            node.argument = t4.objectExpression([
              t4.spreadElement(node.argument)
            ]);
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
            t4.arrayExpression(uniqueDependencies.filter((dep) => dep !== void 0).map((dep) => t4.numericLiteral(dep)))
          )
        );
      });
    }
  }
}

// plugin/src/variants.ts
var t5 = __toESM(require("@babel/types"));
function extractVariants(path, state) {
  const maybeVariants = path.node.body.filter((node2) => t5.isExpressionStatement(node2) && t5.isCallExpression(node2.expression) && t5.isMemberExpression(node2.expression.callee));
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
  const newUniqueName = path.scope.generateUidIdentifier(calleeName);
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
  const pathIndex = path.node.body.findIndex((bodyPath) => bodyPath === targetVariant);
  const rest = path.node.body.slice(pathIndex + 1);
  const statement = t5.blockStatement([
    finalDeclaration,
    ...rest
  ]);
  path.node.body = [
    ...path.node.body.slice(0, pathIndex),
    shadowDeclaration,
    statement
  ];
  state.file.hasVariants = true;
}

// plugin/src/index.ts
function index_default() {
  return {
    name: "babel-react-native-unistyles",
    visitor: {
      Program: {
        enter(path, state) {
          state.file.replaceWithUnistyles = REPLACE_WITH_UNISTYLES_PATHS.concat(state.opts.autoProcessPaths ?? []).some((path2) => state.filename?.includes(path2));
          state.file.hasAnyUnistyle = false;
          state.file.hasUnistylesImport = false;
          state.file.hasVariants = false;
          state.file.styleSheetLocalName = "";
          state.file.tagNumber = 0;
          state.reactNativeImports = {};
          state.file.forceProcessing = state.opts.autoProcessRoot && state.filename ? state.filename.includes(`${state.file.opts.root}/${state.opts.autoProcessRoot}/`) : false;
          path.traverse({
            BlockStatement(blockPath) {
              if (isInsideNodeModules(state)) {
                return;
              }
              extractVariants(blockPath, state);
            }
          });
        },
        exit(path, state) {
          if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
            return;
          }
          if (state.file.hasAnyUnistyle || state.file.hasVariants || state.file.replaceWithUnistyles || state.file.forceProcessing) {
            addUnistylesImport(path, state);
          }
        }
      },
      FunctionDeclaration(path, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path.node.id ? path.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      ClassDeclaration(path, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        const componentName = path.node.id ? path.node.id.name : null;
        if (componentName) {
          state.file.hasVariants = false;
        }
      },
      VariableDeclaration(path, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        path.node.declarations.forEach((declaration) => {
          if (t6.isArrowFunctionExpression(declaration.init) || t6.isFunctionExpression(declaration.init)) {
            const componentName = declaration.id && t6.isIdentifier(declaration.id) ? declaration.id.name : null;
            if (componentName) {
              state.file.hasVariants = false;
            }
          }
        });
      },
      ImportDeclaration(path, state) {
        const exoticImport = REPLACE_WITH_UNISTYLES_EXOTIC_PATHS.concat(state.opts.autoRemapImports ?? []).find((exotic) => state.filename?.includes(exotic.path));
        if (exoticImport) {
          return handleExoticImport(path, state, exoticImport);
        }
        if (isInsideNodeModules(state) && !state.file.replaceWithUnistyles) {
          return;
        }
        const importSource = path.node.source.value;
        if (importSource.includes("react-native-unistyles")) {
          state.file.hasUnistylesImport = true;
          path.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && specifier.imported.name === "StyleSheet") {
              state.file.styleSheetLocalName = specifier.local.name;
            }
          });
        }
        if (importSource === "react-native") {
          path.node.specifiers.forEach((specifier) => {
            if (t6.isImportSpecifier(specifier) && t6.isIdentifier(specifier.imported) && REACT_NATIVE_COMPONENT_NAMES.includes(specifier.imported.name)) {
              state.reactNativeImports[specifier.local.name] = specifier.imported.name;
            }
          });
        }
        if (importSource.includes("react-native/Libraries")) {
          handleExoticImport(path, state, NATIVE_COMPONENTS_PATHS);
        }
        if (!state.file.forceProcessing && Array.isArray(state.opts.autoProcessImports)) {
          state.file.forceProcessing = state.opts.autoProcessImports.includes(importSource);
        }
      },
      JSXElement(path, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (hasStringRef(path)) {
          throw new Error("Detected string based ref which is not supported by Unistyles.");
        }
      },
      CallExpression(path, state) {
        if (isInsideNodeModules(state)) {
          return;
        }
        if (!isUnistylesStyleSheet(path, state) && !isKindOfStyleSheet(path, state)) {
          return;
        }
        state.file.hasAnyUnistyle = true;
        addStyleSheetTag(path, state);
        const arg = t6.isAssignmentExpression(path.node.arguments[0]) ? path.node.arguments[0].right : path.node.arguments[0];
        if (t6.isObjectExpression(arg)) {
          const detectedDependencies = getStylesDependenciesFromObject(path);
          if (detectedDependencies) {
            if (t6.isObjectExpression(arg)) {
              arg.properties.forEach((property) => {
                if (t6.isObjectProperty(property) && t6.isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                  addDependencies(state, property.key.name, property, detectedDependencies[property.key.name] ?? []);
                }
              });
            }
          }
        }
        if (t6.isArrowFunctionExpression(arg) || t6.isFunctionExpression(arg)) {
          const funcPath = t6.isAssignmentExpression(path.node.arguments[0]) ? path.get("arguments.0.right") : path.get("arguments.0");
          const detectedDependencies = getStylesDependenciesFromFunction(funcPath);
          if (detectedDependencies) {
            const body = t6.isBlockStatement(arg.body) ? arg.body.body.find((statement) => t6.isReturnStatement(statement))?.argument : arg.body;
            if (t6.isObjectExpression(body)) {
              body.properties.forEach((property) => {
                if (t6.isObjectProperty(property) && t6.isIdentifier(property.key) && Object.prototype.hasOwnProperty.call(detectedDependencies, property.key.name)) {
                  addDependencies(state, property.key.name, property, detectedDependencies[property.key.name] ?? []);
                }
              });
            }
          }
        }
      }
    }
  };
}
