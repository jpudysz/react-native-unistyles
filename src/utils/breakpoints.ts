import { unistyles } from '../core'
import type { NestedStyle, NestedStylePairs, RNValue } from '../types'
import type { UnistylesBreakpoints } from '../global'
import { ScreenOrientation, isMobile, Orientation, throwError } from '../common'
import { getKeyForUnistylesMediaQuery } from './mqParser'

export const sortAndValidateBreakpoints = (breakpoints: UnistylesBreakpoints): UnistylesBreakpoints => {
    const sortedPairs = Object
        .entries(breakpoints)
        .sort((breakpoint1, breakpoint2) => {
            const [, value1] = breakpoint1
            const [, value2] = breakpoint2

            return (value1 as number) - (value2 as number)
        })

    const sortedBreakpoints =  Object.freeze(Object.fromEntries(sortedPairs)) as UnistylesBreakpoints
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

export const getBreakpointFromScreenWidth = (width: number, breakpointEntries: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>): keyof UnistylesBreakpoints & string => {
    const [key] = breakpointEntries
        .find(([, value], index, otherBreakpoints) => {
            const minVal = value as number
            const maxVal = otherBreakpoints[index + 1]?.[1]

            if (!maxVal) {
                return true
            }

            return width >= minVal && width < maxVal
        }) as [keyof UnistylesBreakpoints & string, number]

    return key
}

export const getValueForBreakpoint = (value: NestedStyle): RNValue => {
    // the highest priority is for custom media queries
    const customMediaQueryKey = getKeyForUnistylesMediaQuery(
        Object.entries(value) as NestedStylePairs,
        unistyles.runtime.screen
    ) as keyof typeof value

    if (customMediaQueryKey) {
        return value[customMediaQueryKey]
    }

    // at this point user didn't use custom media queries (:w, :h)
    // check if user defined any breakpoints
    const hasBreakpoints = unistyles.runtime.sortedBreakpoints.length > 0

    // if not then we can fall back to horizontal and portrait (mobile only)
    if (!hasBreakpoints && isMobile && (Orientation.Landscape in value || Orientation.Portrait in value)) {
        return value[
            unistyles.runtime.orientation === ScreenOrientation.Portrait
                ? Orientation.Portrait
                : Orientation.Landscape
        ]
    }

    // let's get the current breakpoint
    const breakpoint = unistyles.runtime.breakpoint

    if (!breakpoint) {
        return undefined
    }

    // if user defined breakpoints, then we look for the valid one
    const directBreakpoint = value[breakpoint]

    // if there is a direct key like 'sm' or 'md', or value for this key exists but its undefined
    if (directBreakpoint || (breakpoint in value)) {
        return directBreakpoint
    }

    // there is no direct hit for breakpoint nor media-query, let's simulate CSS cascading
    const breakpointPairs = unistyles.runtime.sortedBreakpoints
    const currentBreakpoint = breakpointPairs
        .findIndex(([key]) => key === breakpoint)

    const availableBreakpoints = breakpointPairs
        .filter(([key], index) => index < currentBreakpoint && key && key in value)
        .map(([key]) => key)

    return breakpointPairs.length > 0
        ? value[availableBreakpoints[availableBreakpoints.length - 1] as keyof UnistylesBreakpoints & string]
        : undefined
}
