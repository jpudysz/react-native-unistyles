import type { ScreenSize } from '../types'

/**
 * Extracts numeric values from a coded string.
 *
 * The function is designed to process strings that have a format like "w[100,200]" or "h[300]".
 * It removes characters 'w', 'h', '[', and ']' from the input string and then extracts the numbers.
 *
 * @param {string} codedValue - The input string to extract values from.
 * @returns {Array<number>} An array of extracted numbers. Can contain one or two numbers based on the input format.
 *
 * @example
 * extractValues("w[100,200]") // returns [100, 200]
 * extractValues("h[300]")     // returns [300]
 * extractValues("h[,300]")    // returns [0,300]
 * extractValues("h[100,]")    // returns [100]
 */
export const extractValues = (codedValue: string): Array<number> => {
    const cleanedValue = codedValue.replace(/[wh ]/g, '')
    const [left, right] = cleanedValue.split(',') as [string, string | undefined]

    if (!right) {
        const lh = left.startsWith('[')
            ? Number(left.replace(/[[\]()]/g, ''))
            : Number(left.replace(/[[\]()]/g, '')) + 1

        return [lh]
    }

    const lh = left.startsWith('[')
        ? Number(left.replace('[', ''))
        : Number(left.replace('(', '')) + 1
    const rh = right.endsWith(']')
        ? Number(right.replace(']', ''))
        : Number(right.replace(')', '')) - 1

    return [lh, rh]
}

/**
 * Determines if the given screen size matches the specified breakpoint query.
 *
 * The function checks if the screen size (width and/or height) falls within the range
 * specified by the breakpoint query. The query can specify width (using 'w'), height (using 'h'),
 * or both.
 *
 * @param {string} query - The breakpoint query string. Examples: 'w[100,200]', 'h[300]', 'w[100,200]h[300,400]'.
 * @param {ScreenSize} screenSize - The screen size to check against the breakpoint query.
 * @returns {boolean} True if the screen size matches the breakpoint query, false otherwise.
 *
 * @example
 * const screenSize = { width: 150, height: 350 }
 * isWithinBreakpoint('w[100,200]', screenSize) // returns true
 * isWithinBreakpoint('h[400]', screenSize)     // returns false
 */
export const isWithinBreakpoint = (query: string, screenSize: ScreenSize): boolean => {
    if (query.includes('w') && query.includes('h')) {
        return isWithinTheWidthAndHeight(query, screenSize)
    }

    if (query.charAt(0) === 'w') {
        return isWithinTheWidth(query, screenSize.width)
    }

    if (query.charAt(0) === 'h') {
        return isWithinTheHeight(query, screenSize.height)
    }

    return false
}

/**
 * Determines if the given width matches the specified width range in the query.
 *
 * The function checks if the provided width falls within the range specified by the query.
 * The query specifies a width range using a format like 'w[100,200]'. If only one value is provided,
 * it's treated as a minimum width.
 *
 * @param {string} query - The width query string. Examples: 'w[100,200]' or 'w[100]'.
 * @param {number} width - The width to check against the query.
 * @returns {boolean} True if the width matches the query range, false otherwise.
 *
 * @example
 * isWithinTheWidth('w[100,200]', 150) // returns true
 * isWithinTheWidth('w[100]', 50)      // returns false
 * isWithinTheWidth('w[100]', 150)     // returns true
 */
export const isWithinTheWidth = (query: string, width: number): boolean => {
    const [minWidth, maxWidth] = extractValues(query) as [number, number | undefined]

    if (maxWidth && width >= minWidth && width <= maxWidth) {
        return true
    }

    return !maxWidth && width >= minWidth
}

/**
 * Determines if the given height matches the specified height range in the query.
 *
 * The function checks if the provided height falls within the range specified by the query.
 * The query specifies a height range using a format like 'h[100,200]'. If only one value is provided,
 * it's treated as a minimum height.
 *
 * @param {string} query - The height query string. Examples: 'h[100,200]' or 'h[100]'.
 * @param {number} height - The height to check against the query.
 * @returns {boolean} True if the height matches the query range, false otherwise.
 *
 * @example
 * isWithinTheHeight('h[100,200]', 150) // returns true
 * isWithinTheHeight('h[100]', 50)      // returns false
 * isWithinTheHeight('h[100]', 150)     // returns true
 */
export const isWithinTheHeight = (query: string, height: number): boolean => {
    const [minHeight, maxHeight] = extractValues(query) as [number, number | undefined]

    if (maxHeight && height >= minHeight && height <= maxHeight) {
        return true
    }

    return !maxHeight && height >= minHeight
}

/**
 * Determines if the given screen size matches both the specified width and height ranges in the query.
 *
 * The function checks if the provided screen size (both width and height) falls within the ranges
 * specified by the query. The query can specify both width and height using a format like 'w[100,200]:h[300,400]'.
 *
 * @param {string} query - The combined width and height query string. Example: 'w[100,200]:h[300,400]'.
 * @param {ScreenSize} screenSize - The screen size to check against the query.
 * @returns {boolean} True if the screen size matches both the width and height ranges in the query, false otherwise.
 *
 * @example
 * const screenSize = { width: 150, height: 350 }
 * isWithinTheWidthAndHeight('w[100,200]:h[300,400]', screenSize) // returns true
 * isWithinTheWidthAndHeight('w[100,200]:h[400,500]', screenSize) // returns false
 */
export const isWithinTheWidthAndHeight = (query: string, screenSize: ScreenSize): boolean => {
    const result = query
        .split(':')
        .filter(Boolean)
        .map(q => isWithinBreakpoint(q, screenSize))
        .filter(Boolean)

    return result.length === 2
}

/**
 * Checks if the given query string is a valid custom media query.
 *
 * The valid custom media query formats include:
 * - :w[200]
 * - :w[0, 200]
 * - :w[, 300]
 * - :h[200]
 * - :h[0, 500]
 * - :h[,200]
 * - :w[100, 300]:h[200,500]
 * - :h[200,500]:w[100, 300]
 *
 * @param {string} query - The query string to be checked.
 * @returns {boolean} Returns `true` if the query is a valid custom media query, otherwise `false`.
 * @example
 *
 * isMediaQuery(':w[200]') // true
 * isMediaQuery(':w100]')  // false
 */
export const isMediaQuery = (query: string): boolean => {
    const regex = /^(?:(:w\[\d*(?:,\s?\d+)?])?(:h\[\d*(?:,\s?\d+)?])?|(:h\[\d*(?:,\s?\d+)?])?(:w\[\d*(?:,\s?\d+)?])?)$/

    return query.length > 0 && regex.test(query)
}

/**
 * Retrieves the first matching custom media query key based on the provided screen size.
 *
 * The function processes an array of media queries and returns the first query that matches
 * the given screen size. The media queries can be in formats like:
 * - w[200]
 * - w[0, 200]
 * - w[, 300]
 * - h[200]
 * - h[0, 500]
 * - h[,200]
 * - w[100, 300]:h[200,500]
 * - h[200,500]:w[100, 300]
 *
 * @param {Array<[string, string | number]>} mediaQueries - An array of tuples containing media query keys and associated values.
 * @param {ScreenSize} screenSize - An object representing the screen size to be checked against the media queries.
 * @returns {string | undefined} Returns the first matching media query key or `undefined` if no match is found.
 * @example
 *
 * const queries = [[':w[200]', 'value1'], [':h[300,500]', 'value2']]
 * const size = { width: 250, height: 400 }
 * getKeyForCustomMediaQuery(queries, size) // ':w[200]
 */
export const getKeyForCustomMediaQuery = (mediaQueries: Array<[string, string | number | undefined]>, screenSize: ScreenSize): string | undefined => {
    const [matchedQuery] = mediaQueries
        .flatMap(([key]) => {
            if (key.includes('w') && key.includes('h')) {
                return isWithinBreakpoint(key, screenSize) ? key : undefined
            }

            return key
                .split(':')
                .filter(Boolean)
                .map(query => isWithinBreakpoint(query, screenSize) ? key : undefined)
        })
        .filter(Boolean)

    return matchedQuery
}
