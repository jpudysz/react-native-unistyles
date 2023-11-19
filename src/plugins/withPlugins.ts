import type { RNStyle, UnistylesPlugin } from '../types'
import type { UnistylesRuntime } from '../core'

export const withPlugins = (
    key: string,
    style: RNStyle,
    plugins: Array<UnistylesPlugin>,
    runtime: UnistylesRuntime
) => plugins.reduce((acc, plugin) => {
    if (plugin.onParsedStyle) {
        return plugin.onParsedStyle(key, acc, runtime)
    }

    return acc
}, style)
