type MetroConfig = {
    resolver?: {
        resolveRequest?: ((...args: Array<any>) => any) | null
    }
}

/**
 * Experimental, replaces `react-native-unistyles/plugin` in babel.config.js
 *
 * Every `react-native` import (also from node_modules) resolves to Unistyles components
 * and Unistyles records the dependencies of every StyleSheet while it runs, there is no Babel transform.
 * There is nothing to configure: no `root`, `autoProcessImports`, `autoProcessPaths` or `autoRemapImports`.
 *
 * ```js
 * const { getDefaultConfig } = require('expo/metro-config')
 * const { withUnistylesConfig } = require('react-native-unistyles/metro')
 *
 * module.exports = withUnistylesConfig(getDefaultConfig(__dirname))
 * ```
 */
export declare const withUnistylesConfig: <T extends MetroConfig>(config: T) => T
