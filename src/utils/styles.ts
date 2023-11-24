import type { NestedStyle, UnistylesPlugin, StyleSheet, Optional } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import type { UnistylesRuntime } from '../core'
import { isAndroid, isIOS } from '../common'
import { getStyleWithVariants } from './variants'
import { withPlugins } from '../plugins'

export const proxifyFunction = (
    key: string,
    fn: Function,
    plugins: Array<UnistylesPlugin>,
    runtime: UnistylesRuntime,
    variant?: Record<string, Optional<string>>
): Function => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) =>
        parseStyle(key, target.apply(thisArg, argumentsList), plugins, runtime, variant)
})

export const isPlatformColor = <T extends {}>(value: T): boolean => {
    if (isIOS) {
        return 'semantic' in value && typeof value.semantic === 'object'
    }

    return isAndroid && 'resource_paths' in value && typeof value.resource_paths === 'object'
}

export const parseStyle = <T extends StyleSheet>(
    key: string,
    style: T,
    plugins: Array<UnistylesPlugin>,
    runtime: UnistylesRuntime,
    variant?: Record<string, Optional<string>>
): T => {
    const entries = Object
        .entries(getStyleWithVariants(style || {}, variant)) as Array<[keyof T, StyleSheet]>

    const parsedStyles = Object
        .fromEntries(entries
            .map(([key, value]) => {
                // dynamic functions
                if (typeof value === 'function') {
                    return [key, value]
                }

                // nested objects
                if (key === 'shadowOffset' || key === 'textShadowOffset') {
                    return [
                        key,
                        parseStyle(key, value, plugins, runtime, variant)
                    ]
                }

                // transforms
                if (key === 'transform' && Array.isArray(value)) {
                    return [
                        key,
                        value.map(value => parseStyle(key, value, plugins, runtime, variant))
                    ]
                }

                // values or platform colors
                if (typeof value !== 'object' || isPlatformColor(value)) {
                    return [key, value]
                }

                return [
                    key,
                    getValueForBreakpoint(value as NestedStyle)
                ]
            })
        ) as T

    return withPlugins(key, parsedStyles, plugins, runtime) as T
}
