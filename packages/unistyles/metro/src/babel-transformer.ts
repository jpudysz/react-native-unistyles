// Metro's babelTransformerPath, set by withUnistylesConfig
// it wraps the transformer of the user's config and runs the Unistyles Babel plugin on top of it
import fs from 'node:fs'
import path from 'node:path'

import type { BabelTransformer } from './types'

import { METRO_OPTIONS_ENV, METRO_UPSTREAM_TRANSFORMER_ENV } from '../../plugin/src/consts'
import { createBabelTransformer } from './transformer'

// Metro's workers can't read the config, withUnistylesConfig passes it in the environment they inherit
const upstreamPath = process.env[METRO_UPSTREAM_TRANSFORMER_ENV]

if (!upstreamPath) {
    throw new Error(
        'Unistyles 🦄: react-native-unistyles/metro/babel-transformer can be only set by withUnistylesConfig in metro.config.js',
    )
}

const { transform, getCacheKey } = createBabelTransformer({
    upstream: require(upstreamPath) as BabelTransformer,
    options: JSON.parse(process.env[METRO_OPTIONS_ENV] ?? '{}'),
    unistylesRoot: fs.realpathSync(path.join(__dirname, '..')),
})

export { getCacheKey, transform }
