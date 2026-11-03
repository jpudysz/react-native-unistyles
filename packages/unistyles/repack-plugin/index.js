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

// repack-plugin/src/index.ts
var index_exports = {};
__export(index_exports, {
  UnistylesPlugin: () => UnistylesPlugin
});
module.exports = __toCommonJS(index_exports);

// repack-plugin/src/unistylesPlugin.ts
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));

// metro/src/resolver.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));

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
  const getPackageName2 = (filePath) => {
    const parts = filePath.split(`${sep}node_modules${sep}`);
    if (parts.length === 1) {
      return void 0;
    }
    const segments = parts.at(-1).split(sep);
    return segments[0]?.startsWith("@") ? `${segments[0]}${sep}${segments[1]}` : segments[0];
  };
  const nestedModules = path2.join(unistylesRoot, "node_modules");
  const shouldSwapFrom = (originModulePath) => {
    if (originModulePath.startsWith(`${unistylesRoot}${sep}`) && !originModulePath.startsWith(`${nestedModules}${sep}`)) {
      return false;
    }
    const packageName = getPackageName2(originModulePath);
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
    const copyPath = filePath.slice(copyRoot.length + 1);
    return copies.get(copyRoot) === unistylesRoot && !copyPath.startsWith(`node_modules${sep}`) ? path2.join(unistylesRoot, copyPath) : filePath;
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
    if (!shouldSwapFrom(toUnistylesPath(context.originModulePath))) {
      return resolution;
    }
    const swapTarget = getSwapTarget(moduleName, resolution.filePath);
    return swapTarget ? { type: "sourceFile", filePath: swapTarget } : resolution;
  };
};

// repack-plugin/src/unistylesPlugin.ts
var PLUGIN_NAME = "UnistylesPlugin";
var COMPONENTS_REQUEST = "react-native-unistyles/components/native";
var DEEP_COMPONENTS_REQUEST = `${COMPONENTS_REQUEST}/deep`;
var PASSTHROUGH_PACKAGES2 = ["@callstack/repack", "@module-federation"];
var MIN_RSPACK_VERSION = [1, 7, 5];
var isOlderThan = (version, minimum) => {
  const parts = version.split(/[.-]/).map(Number);
  const index = minimum.findIndex((part, partIndex) => part !== (parts[partIndex] ?? 0));
  return index !== -1 && (parts[index] ?? 0) < minimum[index];
};
var getPackageName = (filePath) => {
  const segments = filePath.split(`${import_node_path2.default.sep}node_modules${import_node_path2.default.sep}`).at(-1).split(import_node_path2.default.sep);
  return segments[0]?.startsWith("@") ? `${segments[0]}/${segments[1]}` : segments[0];
};
var UnistylesPlugin = class {
  // replaced in tests
  constructor(unistylesRoot = import_node_fs2.default.realpathSync(import_node_path2.default.join(__dirname, ".."))) {
    this.unistylesRoot = unistylesRoot;
  }
  unistylesRoot;
  apply(compiler) {
    process.env[METRO_ENV] = "true";
    const rspackVersion = compiler.rspack?.rspackVersion;
    if (rspackVersion && isOlderThan(rspackVersion, MIN_RSPACK_VERSION)) {
      throw new Error(
        `Unistyles \u{1F984}: ${PLUGIN_NAME} requires @rspack/core ${MIN_RSPACK_VERSION.join(".")} or newer, found ${rspackVersion}. Older versions share react-native before Unistyles can swap its components.`
      );
    }
    const unistylesRoot = this.unistylesRoot;
    const sourceDir = import_node_path2.default.join(unistylesRoot, "src");
    const componentsIndex = import_node_path2.default.join(sourceDir, "components", "native", "index.ts");
    const deepComponentsDir = import_node_path2.default.join(sourceDir, "components", "native", "deep");
    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      // the `browser` field and export condition lead to lib/module, the components import src,
      // aliases keep these requests as they are, so Module Federation shares them
      "react-native-unistyles$": import_node_path2.default.join(sourceDir, "index.ts"),
      "react-native-unistyles/reanimated$": import_node_path2.default.join(sourceDir, "reanimated", "index.ts"),
      "react-native-unistyles/server$": import_node_path2.default.join(sourceDir, "server", "index.ts"),
      "react-native-unistyles/web$": import_node_path2.default.join(sourceDir, "web-only", "index.ts"),
      [`${COMPONENTS_REQUEST}$`]: componentsIndex,
      [DEEP_COMPONENTS_REQUEST]: deepComponentsDir
    };
    const isCandidate = (request, issuer) => /^react-native(-web|-unistyles)?($|\/)/.test(request) || issuer.startsWith(`${unistylesRoot}${import_node_path2.default.sep}`) && request.endsWith("/trackDependencies");
    const toRequest = (filePath) => {
      if (filePath === componentsIndex) {
        return COMPONENTS_REQUEST;
      }
      return filePath.startsWith(`${deepComponentsDir}${import_node_path2.default.sep}`) ? `${DEEP_COMPONENTS_REQUEST}/${import_node_path2.default.basename(filePath, ".ts")}` : filePath;
    };
    const resolveRequest = createResolveRequest({ unistylesRoot });
    const unresolvedRequests = /* @__PURE__ */ new Set();
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory) => {
      const resolver = compiler.resolverFactory.get("normal", {
        dependencyType: "esm",
        alias: compiler.options.resolve.alias
      });
      normalModuleFactory.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
        const { request } = resolveData;
        const issuer = resolveData.contextInfo?.issuer ?? "";
        if (!issuer || !isCandidate(request, issuer) || PASSTHROUGH_PACKAGES2.some((name) => getPackageName(issuer)?.startsWith(name))) {
          return;
        }
        let resolvedPath;
        const context = {
          originModulePath: issuer,
          resolveRequest: (_context, moduleName) => {
            const result = resolver.resolveSync({}, resolveData.context, moduleName);
            if (typeof result !== "string") {
              return { type: "empty" };
            }
            const filePath = result.split("?")[0];
            resolvedPath ??= filePath;
            return { type: "sourceFile", filePath };
          }
        };
        let resolution;
        try {
          resolution = resolveRequest(context, request, null);
        } catch (error) {
          if (!unresolvedRequests.has(request)) {
            unresolvedRequests.add(request);
            console.warn(
              `Unistyles \u{1F984}: ${PLUGIN_NAME} couldn't resolve "${request}" imported by ${issuer}, Unistyles doesn't swap it. ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }
        if (resolution.type === "sourceFile" && "filePath" in resolution && resolution.filePath !== resolvedPath) {
          resolveData.request = toRequest(resolution.filePath);
        }
      });
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UnistylesPlugin
});
