import type { RNStyle } from '../types'
import { unistyles } from '../core'

export const withPlugins = (
    key: string,
    style: RNStyle
) => unistyles.registry.plugins.reduce((acc, plugin) => {
    if (plugin.onParsedStyle) {
        return plugin.onParsedStyle(key, acc, unistyles.runtime)
    }

    return acc
}, style)
