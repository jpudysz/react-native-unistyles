import fs from 'node:fs'
import path from 'node:path'

import type { MetroConfig, UnistylesMetroOptions } from './types'

import { METRO_OPTIONS_ENV, METRO_UPSTREAM_TRANSFORMER_ENV } from '../../plugin/src/consts'
import { createResolveRequest } from './resolver'

/**
 * Experimental, replaces `react-native-unistyles/plugin` in babel.config.js
 * Every `react-native` import (also from node_modules) resolves to Unistyles components
 * and StyleSheets are processed by the Unistyles Babel plugin, run by Metro
 */
export const withUnistylesConfig = <T extends MetroConfig>(config: T, options: UnistylesMetroOptions = {}): T => {
    const babelTransformerPath = path.join(__dirname, 'babel-transformer.js')
    const upstreamBabelTransformerPath = config.transformer?.babelTransformerPath

    if (upstreamBabelTransformerPath === babelTransformerPath) {
        throw new Error('Unistyles 🦄: withUnistylesConfig was applied twice to the same Metro config')
    }

    if (!upstreamBabelTransformerPath) {
        throw new Error(
            'Unistyles 🦄: Metro config has no babelTransformerPath, pass the config returned by getDefaultConfig to withUnistylesConfig',
        )
    }

    const unistylesOptions: UnistylesMetroOptions = {
        debug: options.debug ?? false,
    }

    // Metro's workers are forked after the config is loaded, they inherit these
    process.env[METRO_UPSTREAM_TRANSFORMER_ENV] = upstreamBabelTransformerPath
    process.env[METRO_OPTIONS_ENV] = JSON.stringify(unistylesOptions)

    return {
        ...config,
        transformer: {
            ...config.transformer,
            babelTransformerPath,
            // part of Metro's transform cache key
            unistyles: unistylesOptions,
        },
        resolver: {
            ...config.resolver,
            resolveRequest: createResolveRequest({
                unistylesRoot: fs.realpathSync(path.join(__dirname, '..')),
                upstream: config.resolver?.resolveRequest,
            }),
        },
    }
}
