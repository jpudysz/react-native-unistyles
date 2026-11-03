import type { Compiler, RspackPluginInstance } from '@rspack/core'

/**
 * Experimental, the Re.Pack (Rspack) counterpart of react-native-unistyles/metro,
 * replaces `react-native-unistyles/plugin` in babel.config.js
 *
 * Every `react-native` import (also from node_modules) resolves to Unistyles components
 * and Unistyles records the dependencies of every StyleSheet while it runs, there is no Babel transform.
 * There is nothing to configure: no `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`.
 *
 * With Module Federation it requires @rspack/core 1.7.5 or newer,
 * share `react-native-unistyles` and `react-native-unistyles/` like `react-native`.
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
