import type { Compiler, RspackPluginInstance } from '@rspack/core'

import type { UnistylesPluginOptions } from '../../plugin'

// like getModulePaths of @callstack/repack, which this module doesn't import: Rspack and Rsbuild apps don't install Re.Pack
// matches the classic paths (node_modules/@scope/name/) and the pnpm ones (node_modules/.pnpm/@scope+name@1.0.0/)
const getModulePaths = (moduleNames: Array<string>) =>
    moduleNames.flatMap((moduleName) => {
        const escapedClassic = moduleName.replace(/[/\\]/g, '[/\\\\]')
        const escapedExotic = moduleName.replace(/[/\\]/g, '\\+')

        return [
            new RegExp(`node_modules([/\\\\])+${escapedClassic}[/\\\\]`),
            new RegExp(`node_modules(.*[/\\\\])+${escapedExotic}[@\\+]`),
        ]
    })

/**
 * @deprecated since 3.9.0, removed in 4.0, use `UnistylesPlugin`
 */
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
])

interface ConstructorParams {
    ruleExcludePaths?: Array<RegExp>
    unistylesPluginOptions?: UnistylesPluginOptions
}

const getUnistyleModuleRules = (excludePathLoader: Array<RegExp>, unistylesPluginOptions?: UnistylesPluginOptions) => {
    const createRule = (test: RegExp, babelPlugins: Array<any>) => ({
        test,
        use: {
            loader: 'react-native-unistyles/repack-plugin',
            options: {
                babelPlugins,
                unistylesPluginOptions,
            },
        },
    })

    return {
        exclude: excludePathLoader,
        oneOf: [
            createRule(/\.[cm]?ts$/, [['@babel/plugin-syntax-typescript', { isTSX: false, allowNamespaces: true }]]),
            createRule(/\.[cm]?tsx$/, [['@babel/plugin-syntax-typescript', { isTSX: true, allowNamespaces: true }]]),
            createRule(/\.[cm]?jsx?$/, ['babel-plugin-syntax-hermes-parser']),
        ],
    }
}

let hasWarned = false

/**
 * @deprecated since 3.9.0, removed in 4.0, use `UnistylesPlugin`
 */
export class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths
    private unistylesPluginOptions

    constructor({ ruleExcludePaths = BASE_REPACK_EXCLUDE_PATHS, unistylesPluginOptions }: ConstructorParams = {}) {
        this.ruleExcludePaths = ruleExcludePaths
        this.unistylesPluginOptions = unistylesPluginOptions
    }

    apply(compiler: Compiler) {
        if (!hasWarned) {
            hasWarned = true
            console.warn(
                'Unistyles 🦄: RepackUnistylePlugin is deprecated and will be removed in Unistyles 4.0. Replace it with UnistylesPlugin from react-native-unistyles/repack-plugin, see https://www.unistyl.es/v3/other/repack#migrating-from-repackunistyleplugin',
            )
        }

        compiler.options.module.rules.push(getUnistyleModuleRules(this.ruleExcludePaths, this.unistylesPluginOptions))
    }
}
