import fs from 'node:fs'
import path from 'node:path'

import type { MetroConfig } from './types'

import { METRO_ENV } from '../../plugin/src/consts'
import { createResolveRequest } from './resolver'

/**
 * Experimental, replaces `react-native-unistyles/plugin` in babel.config.js
 * Every `react-native` import (also from node_modules) resolves to Unistyles components
 * and Unistyles records the dependencies of every StyleSheet while it runs, there is no Babel transform
 */
export const withUnistylesConfig = <T extends MetroConfig>(config: T): T => {
    // Metro's workers are forked after the config is loaded, they inherit it,
    // so the Babel plugin knows that it can't be used together with the Metro integration
    process.env[METRO_ENV] = 'true'

    return {
        ...config,
        resolver: {
            ...config.resolver,
            resolveRequest: createResolveRequest({
                unistylesRoot: fs.realpathSync(path.join(__dirname, '..')),
                upstream: config.resolver?.resolveRequest,
            }),
        },
    }
}
