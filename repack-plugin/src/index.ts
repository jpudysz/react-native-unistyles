import { getModulePaths } from '@callstack/repack';
import type { Compiler, RspackPluginInstance } from '@rspack/core';
import type { UnistylesPluginOptions } from 'react-native-unistyles/plugin';

export const BASE_REPACK_EXCLUDE_PATHS = getModulePaths([
    'react',
    'react-native',
    '@react-native',
    'react-native-macos',
    'react-native-windows',
    'react-native-tvos',
    '@callstack/react-native-visionos',
    '@module-federation',
    'react-native-unistyles',
    'whatwg-fetch',
    '@callstack',
    'react-native-nitro-modules',
    '@callstack/repack',
]);

type RuleExcludePaths = ReturnType<typeof getModulePaths>;

interface ConstructorParams {
    ruleExcludePaths?: RuleExcludePaths;
    unistylesPluginOptions?: UnistylesPluginOptions;
}



const getUnistyleModuleRules = (excludePathLoader: RegExp[], unistylesPluginOptions?: UnistylesPluginOptions) => {
    const createRule = (test: RegExp, babelPlugins: any[]) => ({
        test,
        use: {
            loader: 'react-native-unistyles/repack-plugin/loader.js',
            options: {
                babelPlugins,
                unistylesPluginOptions,
            },
        },
    });

    return ({
        exclude: excludePathLoader,
        oneOf: [
            createRule(/\.[cm]?ts$/, [['@babel/plugin-syntax-typescript', { isTSX: false, allowNamespaces: true }]]),
            createRule(/\.[cm]?js$/, [['@babel/plugin-syntax-typescript', { isTSX: true, allowNamespaces: true }]]),
            createRule(/\.[cm]?jsx?$/, ['babel-plugin-syntax-hermes-parser']),
        ],
    });
} 

export class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths;
    private unistylesPluginOptions;

    constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions }: ConstructorParams = {}) {
        this.ruleExcludePaths = ruleExcludePaths;
        this.unistylesPluginOptions = unistylesPluginOptions;
    }

    apply(compiler: Compiler) {
        compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions));
    }
}
