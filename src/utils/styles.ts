import type { Breakpoints, CustomNamedStyles, ScreenSize, SortedBreakpointEntries } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import { normalizeStyles } from './normalizeStyles'
import { isAndroid, isIOS, isWeb } from './common'

/**
 * Proxies a function to parse its return value for custom media queries or breakpoints.
 *
 * @template B - An object type where keys represent breakpoint names and values represent breakpoint values.
 *
 * @param {Function} fn - The function to be proxified.
 * @param {keyof B & string} breakpoint - The breakpoint name to check against.
 * @param {ScreenSize} screenSize - An object representing the screen size to be checked against the media queries.
 * @param breakpointPairs - sorted pairs of breakpoints
 *
 * @returns {Function} Returns the proxified function
 *
 * @example
 *
 * const myFunction = () => ({ ':w[200]': 'value1', sm: 'value2' })
 * const screenSize = { width: 250, height: 400 }
 * const breakpoints = { sm: 300, md: 600 }
 *
 * const proxifiedFunction = proxifyFunction(myFunction, 'sm', screenSize, breakpoints)
 * proxifiedFunction() // parsed style based on screenSize and breakpoints
 */
export const proxifyFunction = <B extends Breakpoints>(
    fn: Function, breakpoint: keyof B & string,
    screenSize: ScreenSize,
    breakpointPairs: SortedBreakpointEntries<B>
): Function => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) =>
        parseStyle(target.apply(thisArg, argumentsList), breakpoint, screenSize, breakpointPairs)
})

export const isPlatformColor = <T extends {}>(value: T): boolean => {
    if (isIOS) {
        return 'semantic' in value && typeof value.semantic === 'object'
    }

    return isAndroid && 'resource_paths' in value && typeof value.resource_paths === 'object'
}

/**
 * Parses a style object to resolve custom media queries or breakpoints based on the provided screen size and breakpoints.
 *
 * The function processes each key-value pair in the style object. If the value is a function or a valid style (not an object or a 'transform' key),
 * it is returned as-is. Otherwise, the function attempts to resolve the value based on the provided breakpoint, screen size, and defined breakpoints.
 *
 * @template T - The type of the style object.
 * @template B - An object type where keys represent breakpoint names and values represent breakpoint values.
 *
 * @param {CustomNamedStyles<T, B>} style - The style object to be parsed.
 * @param {keyof B & string} breakpoint - The breakpoint name to check against.
 * @param {ScreenSize} screenSize - An object representing the screen size to be checked against the media queries.
 * @param breakpointPairs - sorted pairs of breakpoints
 *
 * @returns {Record<string, string | number | Function>} Returns the parsed style object with resolved custom media queries or breakpoints.
 *
 * @example
 *
 * const style = { fontSize: { sm: '12px', md: '16px' } }
 * const screenSize = { width: 300, height: 400 }
 * const breakpoints = { xs: 0, sm: 300, md: 600 }
 *
 * const parsedStyle = parseStyle(style, 'sm', screenSize, breakpoints)
 * // { fontSize: '12px' }
 */
export const parseStyle = <T, B extends Breakpoints>(
    style: CustomNamedStyles<T, B>,
    breakpoint: keyof B & string,
    screenSize: ScreenSize,
    breakpointPairs: SortedBreakpointEntries<B>
): T => {
    const entries = Object.entries(style || {}) as [[
        keyof T,
        CustomNamedStyles<T, B> | Record<keyof B & string, string | number | undefined>]
    ]

    const parsedStyles = Object
        .fromEntries(entries
            .map(([key, value]) => {
                const hasNestedProperties = key === 'shadowOffset' || key === 'textShadowOffset'

                if (hasNestedProperties) {
                    return [
                        key,
                        parseStyle(value as CustomNamedStyles<T, B>, breakpoint, screenSize, breakpointPairs)
                    ]
                }

                const isTransform = key === 'transform'

                if (isTransform && Array.isArray(value)) {
                    return [
                        key,
                        value.map(value => parseStyle(value, breakpoint, screenSize, breakpointPairs))
                    ]
                }

                const isDynamicFunction = typeof value === 'function'
                const isValidStyle = typeof value !== 'object' || isPlatformColor(value)

                if (isDynamicFunction || isValidStyle) {
                    return [key, value]
                }

                return [
                    key,
                    getValueForBreakpoint<B>(
                        value as Record<keyof B & string, string | number | undefined>,
                        breakpoint,
                        screenSize,
                        breakpointPairs
                    )
                ]
            })
        )

    return isWeb
        ? normalizeStyles(parsedStyles)
        : parsedStyles
}
