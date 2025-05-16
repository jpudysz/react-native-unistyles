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
  RepackUnistylePlugin: () => RepackUnistylePlugin
});
module.exports = __toCommonJS(index_exports);
var import_repack = require("@callstack/repack");
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
      loader: "react-native-unistyles/repack-plugin/loader.js",
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin
});
