type MetroConfig = {
    transformer?: {
        babelTransformerPath?: string
    }
    resolver?: {
        resolveRequest?: ((...args: Array<any>) => any) | null
    }
}

export interface UnistylesMetroOptions {
    /**
     * Logs the dependencies detected in every StyleSheet, same as the `debug` option of the Babel plugin
     */
    debug?: boolean
}

/**
 * Experimental, replaces `react-native-unistyles/plugin` in babel.config.js
 *
 * Every `react-native` import (also from node_modules) resolves to Unistyles components
 * and StyleSheets are processed by the Unistyles Babel plugin, run by Metro.
 * There is nothing to configure: no `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`.
 *
 * ```js
 * const { getDefaultConfig } = require('expo/metro-config')
 * const { withUnistylesConfig } = require('react-native-unistyles/metro')
 *
 * module.exports = withUnistylesConfig(getDefaultConfig(__dirname))
 * ```
 */
export declare const withUnistylesConfig: <T extends MetroConfig>(config: T, options?: UnistylesMetroOptions) => T
