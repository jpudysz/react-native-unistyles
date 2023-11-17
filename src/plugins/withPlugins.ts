import type { RNStyle } from '../types'
import { normalizeWebStylesPlugin } from './normalizeWebStylesPlugin'
import { isWeb } from '../common'
import { unistyles } from '../core'

const UNISTYLES_PLUGINS = isWeb
    ? [normalizeWebStylesPlugin]
    : []

export const withPlugins = (key: string, style: RNStyle) => unistyles.registry.plugins.concat(UNISTYLES_PLUGINS)
    .reduce((acc, plugin) => {
        if (plugin.onParsedStyle) {
            return plugin.onParsedStyle(key, acc, unistyles.runtime)
        }

        return acc
    }, style)
