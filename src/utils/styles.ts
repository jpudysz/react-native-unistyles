import type { CustomNamedStyles, ScreenSize } from '../types'
import { getValueForBreakpoint } from './breakpoints'

/**
 * Proxies a function to parse its return value for custom media queries or breakpoints.
 *
 * If the function's string representation contains a custom media query or a defined breakpoint,
 * the returned function will be proxied to parse its return value based on the provided screen size and breakpoints.
 * If neither is found, the original function is returned.
 *
 * @template B - An object type where keys represent breakpoint names and values represent breakpoint values.
 *
 * @param {Function} fn - The function to be proxified.
 * @param {keyof B & string} breakpoint - The breakpoint name to check against.
 * @param {ScreenSize} screenSize - An object representing the screen size to be checked against the media queries.
 * @param {B} breakpoints - An object representing the defined breakpoints.
 *
 * @returns {Function} Returns the proxified function or the original function if no custom media query or breakpoint is found in its string representation.
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
export const proxifyFunction = <B extends Record<string, number>>(
    fn: Function, breakpoint: keyof B & string,
    screenSize: ScreenSize,
    breakpoints: B
): Function => {
    const stringifiedFunction = fn.toString()
    const hasCustomMediaQuery = stringifiedFunction.includes(':w[') || stringifiedFunction.includes(':h[')
    const hasBreakpoint = Object
        .keys(breakpoints)
        .some(bp => stringifiedFunction.includes(bp))

    if (!hasCustomMediaQuery && !hasBreakpoint) {
        return fn
    }

    return new Proxy(fn, {
        apply: (target, thisArg, argumentsList) =>
            parseStyle(target.apply(thisArg, argumentsList), breakpoint, screenSize, breakpoints)
    })
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
 * @param {B} breakpoints - An object representing the defined breakpoints.
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
export const parseStyle = <T, B extends Record<string, number>>(
    style: CustomNamedStyles<T, B>,
    breakpoint: keyof B & string,
    screenSize: ScreenSize,
    breakpoints: B
) => Object
    .fromEntries(Object
        .entries(style)
        .map(([key, value]) => {
            const isDynamicFunction = typeof value === 'function'
            const isValidStyle = typeof value !== 'object' || key === 'transform'

            if (isDynamicFunction || isValidStyle) {
                return [key, value]
            }

            const valueWithBreakpoint = value as Record<keyof B & string, string | number>

            return [key, getValueForBreakpoint<B>(valueWithBreakpoint, breakpoint, screenSize, breakpoints)]
        })
    )
