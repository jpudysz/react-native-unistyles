import type { UnistylesBreakpoints } from 'react-native-unistyles'
import type { ScreenSize } from '../types'
import type { MediaQueries } from '../types'

const parseLhs = (lhs: string, breakpoints: UnistylesBreakpoints, hasRhs: boolean) => {
    const matches = lhs.match(/([([])|([^[\]()]+)|([\])])/g)

    if (!hasRhs) {
        const [openBracket, value, closeBracket] = matches  as [string, string, string]
        const spacelessValue = value?.trim()
        const parsedNumber = Number(spacelessValue)

        const parsedValue = isNaN(parsedNumber)
            ? breakpoints[spacelessValue as keyof UnistylesBreakpoints] as number
            : parsedNumber

        return [
            Number(openBracket === '('),
            closeBracket === ')'
                ? parsedValue - 1
                : parsedValue
        ]
    }

    const [openBracket, value] = matches as [string, string]

    if (!value) {
        return [Number(openBracket === '(')]
    }

    const spacelessValue = value?.trim()
    const parsedNumber = Number(spacelessValue)

    const parsedValue = isNaN(parsedNumber)
        ? breakpoints[spacelessValue as keyof UnistylesBreakpoints] as number
        : parsedNumber

    return openBracket === '('
        ? [parsedValue - 1]
        : [parsedValue]
}

const parseRhs = (rhs: string, breakpoints: UnistylesBreakpoints) => {
    const matches = rhs.match(/([([])|([^[\]()]+)|([\])])/g)
    const [value, closeBrackets] = matches as [string, string]
    const spacelessValue = value.trim()
    const parsedNumber = Number(spacelessValue)

    const parsedValue = isNaN(parsedNumber)
        ? breakpoints[spacelessValue as keyof UnistylesBreakpoints] as number
        : parsedNumber

    return [
        closeBrackets === ')'
            ? parsedValue - 1
            : parsedValue
    ]
}

export const extractValues = (pattern: string, breakpoints: UnistylesBreakpoints): Array<number> => {
    const [lhs, rhs] = pattern
        .replace(/(:w|:h)/g, '')
        .split(',') as [string, string | undefined]

    if (!rhs) {
        return parseLhs(lhs, breakpoints, false)
    }

    const [parsedLhs] = parseLhs(lhs, breakpoints, true)

    if (parsedLhs === undefined || isNaN(parsedLhs)) {
        return []
    }

    const [parsedRhs] = parseRhs(rhs, breakpoints)

    if (parsedRhs === undefined || isNaN(parsedRhs)) {
        return []
    }

    return [
        parsedLhs,
        parsedRhs
    ]
}

export const isWithinBreakpoint = (query: string, screenSize: ScreenSize, breakpoints: UnistylesBreakpoints): boolean => {
    const hasWidthBreakpoint = query.includes(':w')
    const hasHeightBreakpoint = query.includes(':h')

    if (hasWidthBreakpoint && hasHeightBreakpoint) {
        return isWithinTheWidthAndHeight(query, screenSize, breakpoints)
    }

    if (hasWidthBreakpoint) {
        return isWithinTheWidth(query, screenSize.width, breakpoints)
    }

    if (hasHeightBreakpoint) {
        return isWithinTheHeight(query, screenSize.height, breakpoints)
    }

    return false
}

export const isWithinTheWidth = (query: string, width: number, breakpoints: UnistylesBreakpoints): boolean => {
    const [minWidth, maxWidth] = extractValues(query, breakpoints) as [number, number | undefined]

    if (maxWidth && width >= minWidth && width <= maxWidth) {
        return true
    }

    return !maxWidth && width >= minWidth
}

export const isWithinTheHeight = (query: string, height: number, breakpoints: UnistylesBreakpoints): boolean => {
    const [minHeight, maxHeight] = extractValues(query, breakpoints) as [number, number | undefined]

    if (maxHeight && height >= minHeight && height <= maxHeight) {
        return true
    }

    return !maxHeight && height >= minHeight
}

export const isWithinTheWidthAndHeight = (query: string, screenSize: ScreenSize, breakpoints: UnistylesBreakpoints): boolean => {
    const result = query
        .split(':')
        .filter(Boolean)
        .map(q => isWithinBreakpoint(`:${q}`, screenSize, breakpoints))
        .filter(Boolean)

    return result.length === 2
}

export const isMediaQuery = (query: string): boolean => {
    const regex = /(:w|:h)/

    return query.length > 0 && regex.test(query)
}

export const getKeyForCustomMediaQuery = (
    mediaQueries: Array<[keyof UnistylesBreakpoints | MediaQueries, string | number | undefined]>,
    screenSize: ScreenSize,
    breakpoints: UnistylesBreakpoints
): string | undefined => {
    const [matchedQuery] = mediaQueries
        .flatMap(([key]) => isWithinBreakpoint(key, screenSize, breakpoints) ? key : undefined)
        .filter(Boolean)

    return matchedQuery
}
