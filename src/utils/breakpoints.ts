import { throwError } from './common'
import type { Breakpoints, ScreenSize, SortedBreakpointEntries } from '../types'
import { getKeyForCustomMediaQuery, isMediaQuery } from './mediaQueries'

/**
 * Sorts the breakpoints object based on its numeric values in ascending order and validates them.
 *
 * This function takes an object where keys represent breakpoint names and values are numeric.
 * It returns a new object with the same keys but sorted based on their corresponding numeric values.
 * Additionally, it validates that:
 * 1. The first breakpoint starts with a value of 0.
 * 2. No duplicate breakpoint values exist.
 *
 * If the validation fails, appropriate error messages are logged to the console.
 *
 * @template B - An object type where keys are strings and values are numbers.
 * @param {B} breakpoints - The breakpoints object to be sorted and validated.
 * @returns {B} A new object with sorted and validated breakpoints.
 *
 * @example
 * const input = { md: 768, lg: 1024, sm: 0 }
 * sortAndValidateBreakpoints(input) // returns { sm: 0, md: 768, lg: 1024 }
 */
export const sortAndValidateBreakpoints = <B extends Breakpoints>(breakpoints: B): B => {
    const sortedPairs = Object
        .entries(breakpoints)
        .sort((breakpoint1, breakpoint2) => {
            const [, value1] = breakpoint1
            const [, value2] = breakpoint2

            return value1 - value2
        })

    const sortedBreakpoints =  Object.freeze(Object.fromEntries(sortedPairs)) as B
    const breakpointValues = Object.values(sortedBreakpoints)
    const [firstBreakpoint] = breakpointValues

    if (firstBreakpoint !== 0) {
        throwError('first breakpoint must start with 0')
    }

    if (breakpointValues.length !== new Set(breakpointValues).size) {
        throwError('breakpoint values are duplicated')
    }

    return sortedBreakpoints
}

/**
 * Determines the appropriate breakpoint key for a given screen width based on provided breakpoints.
 *
 * This function takes a screen width and an object of breakpoints. It returns the key of the breakpoint
 * that the screen width falls into. The breakpoints are assumed to be sorted in ascending order.
 *
 * @template B - An object type where keys are strings and values are numbers representing screen widths.
 * @param {number} width - The screen width to determine the breakpoint for.
 * @param breakpointEntries - sorted pairs of breakpoints
 * @returns {keyof B & string} The key of the breakpoint that the screen width falls into.
 *
 * @example
 * const breakpoints = { sm: 0, md: 768, lg: 1024 }
 * getBreakpointFromScreenWidth(800, breakpoints) // returns 'md'
 */
export const getBreakpointFromScreenWidth = <B extends Breakpoints>(width: number, breakpointEntries: SortedBreakpointEntries<B>): keyof B & string => {
    const [key] = breakpointEntries
        .find(([, value], index, otherBreakpoints) => {
            const minVal = value
            const maxVal = otherBreakpoints[index + 1]?.[1]

            if (!maxVal) {
                return true
            }

            return width >= minVal && width < maxVal
        }) as [keyof B & string, number]

    return key
}

/**
 * Retrieves the value associated with a given breakpoint or custom media query based on the provided screen size.
 *
 * The function first checks for custom media queries. If a matching custom media query is found, its associated value is returned.
 * If no custom media query matches, the function then checks for a direct breakpoint match.
 * If there's no direct breakpoint match, the function simulates CSS cascading to find the closest matching breakpoint.
 *
 * @template B - An object type where keys represent breakpoint names and values represent breakpoint values.
 *
 * @param {Record<keyof B & string, string | number>} value - An object containing values associated with breakpoints or custom media queries.
 * @param {keyof B & string} breakpoint - The breakpoint name to check against.
 * @param {ScreenSize} screenSize - An object representing the screen size to be checked against the media queries.
 * @param breakpointPairs - sorted pairs of breakpoints
 *
 * @returns {string | number | undefined} Returns the value associated with the matching breakpoint or custom media query, or `undefined` if no match is found.
 *
 * @example
 *
 * const values = { ':w[200]': 'value1', sm: 'value2', md: 'value3' }
 * const screenSize = { width: 250, height: 400 }
 * const breakpoints = { sm: 300, md: 600, lg: 900 }
 *
 * getValueForBreakpoint(values, 'sm', screenSize, breakpoints); // 'value1'
 */
export const getValueForBreakpoint = <B extends Breakpoints>(
    value: Record<keyof B & string, string | number | undefined>,
    breakpoint: keyof B & string,
    screenSize: ScreenSize,
    breakpointPairs: SortedBreakpointEntries<B>
): string | number | undefined => {
    // the highest priority is for custom media queries
    const customMediaQueries = Object
        .entries(value)
        .filter(([key]) => isMediaQuery(key))
    const customMediaQueryKey = getKeyForCustomMediaQuery(customMediaQueries, screenSize)

    if (customMediaQueryKey && customMediaQueryKey in value) {
        return value[customMediaQueryKey]
    }

    // if no custom media query, or didn't match, proceed with defined breakpoints
    const unifiedKey = breakpoint.toLowerCase()
    const directBreakpoint = value[unifiedKey]

    // if there is a direct key like 'sm' or 'md', or value for this key exists but its undefined
    if (directBreakpoint || (unifiedKey in value)) {
        return directBreakpoint
    }

    // there is no direct hit for breakpoint nor media-query, so let's simulate CSS cascading
    const currentBreakpoint = breakpointPairs
        .findIndex(([key]) => key === unifiedKey)

    const availableBreakpoints = breakpointPairs
        .filter(([key], index) => index < currentBreakpoint && key && key in value)
        .map(([key]) => key)

    return breakpointPairs.length > 0
        ? value[availableBreakpoints[availableBreakpoints.length - 1] as keyof B & string]
        : undefined
}
