"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// repack-plugin/src/index.ts
var index_exports = {};
__export(index_exports, {
  BASE_REPACK_EXCLUDE_PATHS: () => BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin: () => RepackUnistylePlugin,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_repack = require("@callstack/repack");

// repack-plugin/src/loader.ts
var import_core = require("@babel/core");

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
  "react-native-reanimated/lib/module/component"
];

// repack-plugin/src/loader.ts
var importName = "react-native-unistyles";
var UNISTYLES_REGEX = new RegExp(
  [...REACT_NATIVE_COMPONENT_NAMES, ...REPLACE_WITH_UNISTYLES_PATHS, importName].join("|")
);
function unistylesLoader(source) {
  this.cacheable();
  const callback = this.async();
  const options = this.getOptions();
  if (!UNISTYLES_REGEX.test(source)) {
    callback(null, source);
    return;
  }
  const unistylesOptions = options.unistylesPluginOptions;
  const unistylesPlugin = unistylesOptions ? ["react-native-unistyles/plugin", unistylesOptions] : "react-native-unistyles/plugin";
  const babelPlugins = options.babelPlugins ?? [];
  (0, import_core.transform)(
    source,
    {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      compact: false,
      comments: true,
      plugins: [...babelPlugins, unistylesPlugin]
    },
    (err, result) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, result.code, result.map);
      return;
    }
  );
}

// repack-plugin/src/index.ts
var BASE_REPACK_EXCLUDE_PATHS = (0, import_repack.getModulePaths)([
  "react",
  "react-native",
  "@react-native",
  "react-native-macos",
  "react-native-windows",
  "react-native-tvos",
  "@callstack/react-native-visionos",
  "@module-federation",
  "react-native-unistyles",
  "whatwg-fetch",
  "@callstack",
  "react-native-nitro-modules",
  "@callstack/repack"
]);
var getUnistyleModuleRules = (excludePathLoader, unistylesPluginOptions) => {
  const createRule = (test, babelPlugins) => ({
    test,
    use: {
      loader: "react-native-unistyles/repack-plugin",
      options: {
        babelPlugins,
        unistylesPluginOptions
      }
    }
  });
  return {
    exclude: excludePathLoader,
    oneOf: [
      createRule(/\.[cm]?ts$/, [["@babel/plugin-syntax-typescript", { isTSX: false, allowNamespaces: true }]]),
      createRule(/\.[cm]?tsx$/, [["@babel/plugin-syntax-typescript", { isTSX: true, allowNamespaces: true }]]),
      createRule(/\.[cm]?jsx?$/, ["babel-plugin-syntax-hermes-parser"])
    ]
  };
};
var RepackUnistylePlugin = class {
  ruleExcludePaths;
  unistylesPluginOptions;
  constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions } = {}) {
    this.ruleExcludePaths = ruleExcludePaths;
    this.unistylesPluginOptions = unistylesPluginOptions;
  }
  apply(compiler) {
    compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions));
  }
};
var index_default = unistylesLoader;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin
});
