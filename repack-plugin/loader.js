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

// repack-plugin/src/loader.ts
var loader_exports = {};
__export(loader_exports, {
  default: () => unistylesLoader
});
module.exports = __toCommonJS(loader_exports);
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
  "react-native-reanimated/lib/module/component",
  "react-native-gesture-handler/lib/module/components",
  "react-native-gesture-handler/lib/commonjs/components",
  "react-native-gesture-handler/src/components"
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
      if (result?.code && result.map) {
        callback(null, result.code, result.map);
      }
      return;
    }
  );
}
