import type { CustomNamedStyles, MediaQueries, ScreenSize } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import { normalizeStyles } from './normalizeStyles'
import { isWeb } from './common'
import type { UnistylesBreakpoints } from '../global'

export const proxifyFunction = (
    fn: Function, breakpoint: keyof UnistylesBreakpoints & string,
    screenSize: ScreenSize
): Function => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) =>
        parseStyle(target.apply(thisArg, argumentsList), breakpoint, screenSize)
})

export const parseStyle = <T>(
    style: CustomNamedStyles<T>,
    breakpoint: keyof UnistylesBreakpoints & string,
    screenSize: ScreenSize
): T => {
    const entries = Object.entries(style) as [[
        keyof T,
        CustomNamedStyles<T> | Record<keyof UnistylesBreakpoints & string, string | number | undefined>]
    ]

    const parsedStyles = Object
        .fromEntries(entries
            .map(([key, value]) => {
                const hasNestedProperties = key === 'shadowOffset' || key === 'textShadowOffset'

                if (hasNestedProperties) {
                    return [
                        key,
                        parseStyle(value as CustomNamedStyles<T>, breakpoint, screenSize)
                    ]
                }

                const isTransform = key === 'transform'

                if (isTransform && Array.isArray(value)) {
                    return [
                        key,
                        value.map(value => parseStyle(value, breakpoint, screenSize))
                    ]
                }

                const isDynamicFunction = typeof value === 'function'
                const isValidStyle = typeof value !== 'object'

                if (isDynamicFunction || isValidStyle) {
                    return [key, value]
                }

                return [
                    key,
                    getValueForBreakpoint(value as Record<keyof UnistylesBreakpoints | MediaQueries, string | number | undefined>)
                ]
            })
        )

    return isWeb
        ? normalizeStyles(parsedStyles)
        : parsedStyles
}
