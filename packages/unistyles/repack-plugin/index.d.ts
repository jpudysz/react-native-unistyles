import type { Compiler, LoaderContext, RspackPluginInstance } from '@rspack/core'
import type { UnistylesPluginOptions } from 'react-native-unistyles/plugin'

/**
 * Experimental, the Re.Pack (Rspack) counterpart of react-native-unistyles/metro,
 * replaces `react-native-unistyles/plugin` in babel.config.js
 *
 * Every `react-native` import (also from node_modules) resolves to Unistyles components,
 * except imports without an issuer and imports made by `@callstack/repack` and `@module-federation` packages,
 * and Unistyles records the dependencies of every StyleSheet while it runs, there is no Babel transform.
 * There is nothing to configure: no `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`.
 *
 * It requires @rspack/core 1.7.5 or newer.
 * With Module Federation, share `react-native-unistyles` and `react-native-unistyles/` like `react-native`.
 *
 * ```js
 * import * as Repack from '@callstack/repack'
 * import { UnistylesPlugin } from 'react-native-unistyles/repack-plugin'
 *
 * export default {
 *     plugins: [new Repack.RepackPlugin(), new UnistylesPlugin()],
 * }
 * ```
 */
export declare class UnistylesPlugin implements RspackPluginInstance {
    constructor()
    apply(compiler: Compiler): void
}

/**
 * @deprecated since 3.9.0, removed in 4.0, use `UnistylesPlugin` or the Babel plugin in babel.config.js
 */
export declare const BASE_REPACK_EXCLUDE_PATHS: Array<RegExp>

interface ConstructorParams {
    ruleExcludePaths?: Array<RegExp>
    unistylesPluginOptions?: UnistylesPluginOptions
}

/**
 * @deprecated since 3.9.0, removed in 4.0, use `UnistylesPlugin` or the Babel plugin in babel.config.js
 */
export declare class RepackUnistylePlugin implements RspackPluginInstance {
    private ruleExcludePaths
    private unistylesPluginOptions
    constructor({ ruleExcludePaths, unistylesPluginOptions }?: ConstructorParams)
    apply(compiler: Compiler): void
}

interface UnistylesLoaderOptions {
    babelPlugins?: Array<string>
    unistylesPluginOptions?: UnistylesPluginOptions
}

/**
 * The loader of the deprecated `RepackUnistylePlugin`
 */
declare function unistylesLoader(this: LoaderContext<UnistylesLoaderOptions>, source: string): void

export default unistylesLoader
