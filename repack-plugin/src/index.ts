import { getModulePaths } from "@callstack/repack";
import type { Compiler, RspackPluginInstance } from "@rspack/core";
import type { UnistylesPluginOptions } from "react-native-unistyles/plugin";

export const BASE_REPACK_EXCLUDE_PATHS = getModulePaths([
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
    "@callstack/repack",
]);

type RuleExcludePaths = ReturnType<typeof getModulePaths>;

interface ConstructorParams {
    ruleExcludePaths?: RuleExcludePaths;
    unistylesPluginOptions?: UnistylesPluginOptions;
}

const getUnistyleModuleRules = (excludePathLoader: RegExp[], unistylesPluginOptions?: UnistylesPluginOptions) => ({
    exclude: excludePathLoader,
    oneOf: [
        {
            test: /\.[cm]?ts$/,
            use: {
                loader: "react-native-unistyles/repack-plugin/loader.js",
                options: {
                    babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: false, allowNamespaces: true }]],
                    unistylesPluginOptions,
                },
            },
        },
        {
            test: /\.[cm]?js$/,
            use: {
                loader: "react-native-unistyles/repack-plugin/loader.js",
                options: {
                    babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: false, allowNamespaces: true }]],
                    unistylesPluginOptions,
                },
            },
        },
        {
            test: /\.[cm]?tsx$/,
            use: {
                loader: "react-native-unistyles/repack-plugin/loader.js",
                options: {
                    babelPlugins: [["@babel/plugin-syntax-typescript", { isTSX: true, allowNamespaces: true }]],
                    unistylesPluginOptions,
                },
            },
        },
        {
            test: /\.[cm]?jsx?$/,
            use: {
                loader: "react-native-unistyles/repack-plugin/loader.js",
                options: {
                    babelPlugins: ["babel-plugin-syntax-hermes-parser"],
                    unistylesPluginOptions,
                },
            },
        },
    ],
});

export class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths;
    private unistylesPluginOptions;

    constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions }: ConstructorParams = {}) {
        this.ruleExcludePaths = ruleExcludePaths;
        this.unistylesPluginOptions = unistylesPluginOptions;
    }

    apply(compiler: Compiler) {
        compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions));

        // ignore the 'setUpTests' warning from reanimated which is not relevant
        compiler.options.ignoreWarnings = compiler.options.ignoreWarnings ?? [];
        compiler.options.ignoreWarnings.push((warning) =>
            /'`setUpTests` is available only in Jest environment\.'/.test(warning.message)
        );
    }
}
