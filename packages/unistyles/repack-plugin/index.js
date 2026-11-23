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
  BASE_REPACK_EXCLUDE_PATHS: () => BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin: () => RepackUnistylePlugin,
  UnistylesPlugin: () => UnistylesPlugin,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

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
var METRO_ENV = "UNISTYLES_METRO";
var RSPACK_INTEGRATION = "rspack";

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
  const { transform } = require("@babel/core");
  transform(
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
      callback(null, result?.code ?? void 0, result?.map);
      return;
    }
  );
}

// repack-plugin/src/unistylesPlugin.ts
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));

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
var isSourceFile = (resolution) => resolution.type === "sourceFile" && "filePath" in resolution;
var createResolveRequest = ({
  unistylesRoot,
  integration,
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
          `Unistyles \u{1F984}: Found a second copy of react-native-unistyles at ${realCopyRoot}, ${integration} handles only ${unistylesRoot}. Styles of the second copy won't update, make sure that your app installs react-native-unistyles once.`
        );
      }
    }
    const copyPath = filePath.slice(copyRoot.length + 1);
    return copies.get(copyRoot) === unistylesRoot && !copyPath.startsWith(`node_modules${sep}`) ? path2.join(unistylesRoot, copyPath) : filePath;
  };
  const withTrackedDependencies = (resolution) => isSourceFile(resolution) && resolution.filePath === trackDependencies ? { type: "sourceFile", filePath: trackDependenciesWithMetro } : resolution;
  return (context, moduleName, platform) => {
    const resolve = upstream ?? context.resolveRequest;
    const upstreamResolution = resolve(context, moduleName, platform);
    if (!isSourceFile(upstreamResolution)) {
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
var SWAPPABLE_REQUEST = /^react-native(-web|-unistyles)?($|\/)/;
var PASSTHROUGH_PACKAGES2 = ["@callstack/repack", "@module-federation"];
var MIN_RSPACK_VERSION = [1, 7, 5];
var isOlderThan = (version, minimum) => {
  const [release = "", ...prerelease] = version.split("+")[0].split("-");
  const parts = release.split(".").map(Number);
  const index = minimum.findIndex((part, partIndex) => part !== (parts[partIndex] ?? 0));
  return index === -1 ? prerelease.length > 0 : (parts[index] ?? 0) < minimum[index];
};
var getPackageName = (filePath) => {
  const segments = filePath.split(`${import_node_path2.default.sep}node_modules${import_node_path2.default.sep}`).at(-1).split(import_node_path2.default.sep);
  return segments[0]?.startsWith("@") ? `${segments[0]}/${segments[1]}` : segments[0];
};
var getEntryPointAliases = (unistylesRoot) => {
  const { exports: exports2 = {} } = JSON.parse(import_node_fs2.default.readFileSync(import_node_path2.default.join(unistylesRoot, "package.json"), "utf8"));
  return Object.fromEntries(
    Object.entries(exports2).flatMap(([subpath, conditions]) => {
      const source = conditions && typeof conditions === "object" ? conditions["react-native"] : void 0;
      if (typeof source !== "string" || subpath.includes("*") || !/^\.\/src\/.+\.tsx?$/.test(source) || /\.(native|ios|android|web)\.tsx?$/.test(source)) {
        return [];
      }
      return [[`react-native-unistyles${subpath.slice(1)}$`, import_node_path2.default.join(unistylesRoot, source)]];
    })
  );
};
var getReactNativeAliases = (alias) => Object.entries(alias || {}).flatMap(
  ([name, target]) => typeof target === "string" && SWAPPABLE_REQUEST.test(target) && !SWAPPABLE_REQUEST.test(name) ? [{ exact: name.endsWith("$"), name: name.replace(/\$$/, ""), target }] : []
);
var UnistylesPlugin = class {
  // replaced in tests
  constructor(unistylesRoot = import_node_fs2.default.realpathSync(import_node_path2.default.join(__dirname, ".."))) {
    this.unistylesRoot = unistylesRoot;
  }
  unistylesRoot;
  apply(compiler) {
    const rspackVersion = compiler.rspack?.rspackVersion;
    if (rspackVersion && isOlderThan(rspackVersion, MIN_RSPACK_VERSION)) {
      throw new Error(
        `Unistyles \u{1F984}: ${PLUGIN_NAME} requires @rspack/core ${MIN_RSPACK_VERSION.join(".")} or newer, found ${rspackVersion}. Older versions share react-native before Unistyles can swap its components.`
      );
    }
    process.env[METRO_ENV] = RSPACK_INTEGRATION;
    const unistylesRoot = this.unistylesRoot;
    const sourceDir = import_node_path2.default.join(unistylesRoot, "src");
    const componentsIndex = import_node_path2.default.join(sourceDir, "components", "native", "index.ts");
    const deepComponentsDir = import_node_path2.default.join(sourceDir, "components", "native", "deep");
    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      // the `browser` field and export condition lead to lib/module, the components import src,
      // aliases keep these requests as they are, so Module Federation shares them
      ...getEntryPointAliases(unistylesRoot),
      [`${COMPONENTS_REQUEST}$`]: componentsIndex,
      [DEEP_COMPONENTS_REQUEST]: deepComponentsDir
    };
    const toRequest = (filePath) => {
      if (filePath === componentsIndex) {
        return COMPONENTS_REQUEST;
      }
      return filePath.startsWith(`${deepComponentsDir}${import_node_path2.default.sep}`) ? `${DEEP_COMPONENTS_REQUEST}/${import_node_path2.default.basename(filePath, ".ts")}` : filePath;
    };
    const resolveRequest = createResolveRequest({ unistylesRoot, integration: PLUGIN_NAME });
    const unresolvedRequests = /* @__PURE__ */ new Set();
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory) => {
      const { alias } = compiler.options.resolve;
      const resolver = compiler.resolverFactory.get("normal", { dependencyType: "esm", alias });
      const reactNativeAliases = getReactNativeAliases(alias);
      const getModuleName = (request, issuer) => {
        if (SWAPPABLE_REQUEST.test(request)) {
          return request;
        }
        if (issuer.startsWith(`${unistylesRoot}${import_node_path2.default.sep}`) && request.endsWith("/trackDependencies")) {
          return request;
        }
        for (const { exact, name, target } of reactNativeAliases) {
          if (request === name) {
            return target;
          }
          if (!exact && request.startsWith(`${name}/`)) {
            return `${target}${request.slice(name.length)}`;
          }
        }
        return void 0;
      };
      normalModuleFactory.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
        const { request } = resolveData;
        const issuer = resolveData.contextInfo?.issuer ?? "";
        if (!issuer) {
          return;
        }
        const moduleName = getModuleName(request, issuer);
        if (!moduleName || PASSTHROUGH_PACKAGES2.some((name) => getPackageName(issuer)?.startsWith(name))) {
          return;
        }
        let resolvedPath;
        const context = {
          originModulePath: issuer,
          resolveRequest: (_context, name) => {
            const result = resolver.resolveSync({}, resolveData.context, name);
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
          resolution = resolveRequest(context, moduleName, null);
        } catch (error) {
          if (!unresolvedRequests.has(request)) {
            unresolvedRequests.add(request);
            console.warn(
              `Unistyles \u{1F984}: ${PLUGIN_NAME} couldn't resolve "${request}" imported by ${issuer}, Unistyles doesn't swap it. ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }
        if (isSourceFile(resolution) && resolution.filePath !== resolvedPath) {
          resolveData.request = toRequest(resolution.filePath);
        }
      });
    });
  }
};

// repack-plugin/src/repackUnistylePlugin.ts
var getModulePaths = (moduleNames) => moduleNames.flatMap((moduleName) => {
  const escapedClassic = moduleName.replace(/[/\\]/g, "[/\\\\]");
  const escapedExotic = moduleName.replace(/[/\\]/g, "\\+");
  return [
    new RegExp(`node_modules([/\\\\])+${escapedClassic}[/\\\\]`),
    new RegExp(`node_modules(.*[/\\\\])+${escapedExotic}[@\\+]`)
  ];
});
var BASE_REPACK_EXCLUDE_PATHS = getModulePaths([
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
var hasWarned = false;
var RepackUnistylePlugin = class {
  ruleExcludePaths;
  unistylesPluginOptions;
  constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions } = {}) {
    this.ruleExcludePaths = ruleExcludePaths;
    this.unistylesPluginOptions = unistylesPluginOptions;
  }
  apply(compiler) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn(
        "Unistyles \u{1F984}: RepackUnistylePlugin is deprecated and will be removed in Unistyles 4.0. Replace it with UnistylesPlugin from react-native-unistyles/repack-plugin, or add react-native-unistyles/plugin to babel.config.js. See https://www.unistyl.es/v3/other/repack"
      );
    }
    compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions));
  }
};

// repack-plugin/src/index.ts
var index_default = unistylesLoader;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BASE_REPACK_EXCLUDE_PATHS,
  RepackUnistylePlugin,
  UnistylesPlugin
});
