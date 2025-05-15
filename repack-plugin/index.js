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
var getUnistyleModuleRules = (excludePathLoader, unistylesPluginOptions) => ({
  exclude: excludePathLoader,
  oneOf: [
    {
      test: /\.[cm]?ts$/,
      use: {
        loader: "react-native-unistyles/repack-plugin/loader.js",
        options: {
          babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: false, allowNamespaces: true }]],
          unistylesPluginOptions
        }
      }
    },
    {
      test: /\.[cm]?js$/,
      use: {
        loader: "react-native-unistyles/repack-plugin/loader.js",
        options: {
          babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: false, allowNamespaces: true }]],
          unistylesPluginOptions
        }
      }
    },
    {
      test: /\.[cm]?tsx$/,
      use: {
        loader: "react-native-unistyles/repack-plugin/loader.js",
        options: {
          babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: true, allowNamespaces: true }]],
          unistylesPluginOptions
        }
      }
    },
    {
      test: /\.[cm]?jsx?$/,
      use: {
        loader: "react-native-unistyles/repack-plugin/loader.js",
        options: {
          babelPlugins: ["babel-plugin-syntax-hermes-parser"],
          unistylesPluginOptions
        }
      }
    }
  ]
});
var RepackUnistylePlugin = class {
  ruleExcludePaths;
  unistylesPluginOptions;
  constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions } = {}) {
    this.ruleExcludePaths = ruleExcludePaths;
    this.unistylesPluginOptions = unistylesPluginOptions;
  }
  apply(compiler) {
    compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions));
    compiler.options.ignoreWarnings = compiler.options.ignoreWarnings ?? [];
    compiler.options.ignoreWarnings.push(
      (warning) => /'`setUpTests` is available only in Jest environment\.'/.test(warning.message)
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin
});
