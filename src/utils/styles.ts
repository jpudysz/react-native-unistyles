import type { CustomNamedStyles, NestedStyle, RNStyle, UnistylesPlugin } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import type { UnistylesRuntime } from '../core'
import { isAndroid, isIOS } from '../common'
import { getStyleWithVariant } from './variants'
import { withPlugins } from '../plugins'

export const proxifyFunction = (
    key: string,
    fn: Function,
    plugins: Array<UnistylesPlugin>,
    runtime: UnistylesRuntime,
    variant?: string
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

export const parseStyle = <T extends RNStyle>(
    key: string,
    style: CustomNamedStyles<T>,
    plugins: Array<UnistylesPlugin>,
    runtime: UnistylesRuntime,
    variant?: string
): T => {
    const entries = Object
        .entries(getStyleWithVariant(style || {}, variant)) as Array<[keyof T, CustomNamedStyles<T> | NestedStyle]>

    const parsedStyles = Object
        .fromEntries(entries
            .map(([key, value]) => {
                const hasNestedProperties = key === 'shadowOffset' || key === 'textShadowOffset'

                if (hasNestedProperties) {
                    return [
                        key,
                        parseStyle(key, value as CustomNamedStyles<T>, plugins, runtime, variant)
                    ]
                }

                const isTransform = key === 'transform'

                if (isTransform && Array.isArray(value)) {
                    return [
                        key,
                        value.map(value => parseStyle(key, value, plugins, runtime, variant))
                    ]
                }

                const isDynamicFunction = typeof value === 'function'
                const isValidStyle = typeof value !== 'object' || isPlatformColor(value)

                if (isDynamicFunction || isValidStyle) {
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
