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

// metro/src/index.ts
var index_exports = {};
__export(index_exports, {
  withUnistylesConfig: () => withUnistylesConfig
});
module.exports = __toCommonJS(index_exports);
var import_node_fs2 = __toESM(require("node:fs"));
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
var METRO_ENV = "UNISTYLES_METRO";

// metro/src/resolver.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var DEEP_IMPORTS = [...REACT_NATIVE_COMPONENT_NAMES, "ViewNativeComponent", "TextNativeComponent"];
var PASSTHROUGH_PACKAGES = ["react-native", "@react-native", "react-native-web"];
var getRealPath = (filePath) => {
  try {
    return import_node_fs.default.realpathSync(filePath);
  } catch {
    return filePath;
  }
};
var createResolveRequest = ({
  unistylesRoot,
  upstream,
  path: path2 = import_node_path.default,
  realpath = getRealPath
}) => {
  const { sep } = path2;
  const sourceDir = path2.join(unistylesRoot, "src");
  const componentsDir = path2.join(sourceDir, "components", "native");
  const componentsIndex = path2.join(componentsDir, "index.ts");
  const trackDependencies = path2.join(sourceDir, "core", "trackDependencies.ts");
  const trackDependenciesWithMetro = path2.join(sourceDir, "core", "trackDependencies.metro.ts");
  const builds = [path2.join(unistylesRoot, "lib", "module"), path2.join(unistylesRoot, "lib", "commonjs")];
  const getSourcePath = (filePath) => {
    const build = builds.find((buildDir) => filePath.startsWith(`${buildDir}${sep}`));
    if (!build) {
      return void 0;
    }
    const modulePath = filePath.slice(build.length + 1).replace(/\.js$/, "").replace(/\.(native|ios|android|web)$/, "");
    return path2.join(sourceDir, modulePath);
  };
  const getPackageName = (filePath) => {
    const parts = filePath.split(`${sep}node_modules${sep}`);
    if (parts.length === 1) {
      return void 0;
    }
    const segments = parts.at(-1).split(sep);
    return segments[0]?.startsWith("@") ? `${segments[0]}${sep}${segments[1]}` : segments[0];
  };
  const shouldSwapFrom = (originModulePath) => {
    if (originModulePath.startsWith(`${unistylesRoot}${sep}`)) {
      return false;
    }
    const packageName = getPackageName(originModulePath);
    return !PASSTHROUGH_PACKAGES.some((name) => packageName === name || packageName?.startsWith(`${name}${sep}`));
  };
  const getDeepImport = (filePath) => {
    const segments = filePath.split(sep);
    if (segments.at(-5) === "react-native-web" && segments.at(-4) === "dist" && segments.at(-3) === "exports") {
      return segments.at(-2);
    }
    if (filePath.includes(`${sep}react-native${sep}Libraries${sep}`)) {
      return segments.at(-1)?.split(".").at(0);
    }
    return void 0;
  };
  const getSwapTarget = (moduleName, filePath) => {
    if (moduleName === "react-native" || filePath.endsWith(`${sep}react-native-web${sep}dist${sep}index.js`)) {
      return componentsIndex;
    }
    const deepImport = getDeepImport(filePath);
    return deepImport && DEEP_IMPORTS.includes(deepImport) ? path2.join(componentsDir, "deep", `${deepImport}.ts`) : void 0;
  };
  const copies = /* @__PURE__ */ new Map();
  const packageDir = `${sep}node_modules${sep}react-native-unistyles${sep}`;
  const toUnistylesPath = (filePath) => {
    if (filePath.startsWith(`${unistylesRoot}${sep}`)) {
      return filePath;
    }
    const index = filePath.lastIndexOf(packageDir);
    if (index === -1) {
      return filePath;
    }
    const copyRoot = filePath.slice(0, index + packageDir.length - 1);
    if (!copies.has(copyRoot)) {
      const realCopyRoot = realpath(copyRoot);
      copies.set(copyRoot, realCopyRoot);
      if (realCopyRoot !== unistylesRoot) {
        console.warn(
          `Unistyles \u{1F984}: Found a second copy of react-native-unistyles at ${realCopyRoot}, withUnistylesConfig handles only ${unistylesRoot}. Styles of the second copy won't update, make sure that your app installs react-native-unistyles once.`
        );
      }
    }
    return copies.get(copyRoot) === unistylesRoot ? path2.join(unistylesRoot, filePath.slice(copyRoot.length + 1)) : filePath;
  };
  const withTrackedDependencies = (resolution) => resolution.type === "sourceFile" && "filePath" in resolution && resolution.filePath === trackDependencies ? { type: "sourceFile", filePath: trackDependenciesWithMetro } : resolution;
  return (context, moduleName, platform) => {
    const resolve = upstream ?? context.resolveRequest;
    const upstreamResolution = resolve(context, moduleName, platform);
    if (upstreamResolution.type !== "sourceFile" || !("filePath" in upstreamResolution)) {
      return upstreamResolution;
    }
    const filePath = toUnistylesPath(upstreamResolution.filePath);
    const resolution = filePath === upstreamResolution.filePath ? upstreamResolution : { type: "sourceFile", filePath };
    const sourcePath = getSourcePath(resolution.filePath);
    if (sourcePath) {
      return withTrackedDependencies(resolve(context, sourcePath, platform));
    }
    if (resolution.filePath === trackDependencies) {
      return withTrackedDependencies(resolution);
    }
    if (!shouldSwapFrom(context.originModulePath)) {
      return resolution;
    }
    const swapTarget = getSwapTarget(moduleName, resolution.filePath);
    return swapTarget ? { type: "sourceFile", filePath: swapTarget } : resolution;
  };
};

// metro/src/index.ts
var withUnistylesConfig = (config) => {
  process.env[METRO_ENV] = "true";
  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest: createResolveRequest({
        unistylesRoot: import_node_fs2.default.realpathSync(import_node_path2.default.join(__dirname, "..")),
        upstream: config.resolver?.resolveRequest
      })
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  withUnistylesConfig
});
