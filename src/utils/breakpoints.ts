import { unistyles } from '../core'
import type { Optional, RNValue } from '../types'
import type { UnistylesBreakpoints } from '../global'
import { ScreenOrientation, isMobile } from '../common'
import { getKeyForUnistylesMediaQuery } from './mqParser'

export const getValueForBreakpoint = (value: Record<string, RNValue>): Optional<RNValue> => {
    const customMediaQueryKey = getKeyForUnistylesMediaQuery(
        Object.entries(value),
        unistyles.runtime.screen
    ) as keyof typeof value

    if (customMediaQueryKey) {
        return value[customMediaQueryKey]
    }

    const hasBreakpoints = unistyles.registry.sortedBreakpointPairs.length > 0

    if (!hasBreakpoints && isMobile && (ScreenOrientation.Landscape in value || ScreenOrientation.Portrait in value)) {
        return value[unistyles.runtime.orientation]
    }

    const breakpoint = unistyles.runtime.breakpoint

    if (!breakpoint) {
        return undefined
    }

    const directBreakpoint = value[breakpoint]

    if (directBreakpoint || (breakpoint in value)) {
        return directBreakpoint
    }

    const breakpointPairs = unistyles.registry.sortedBreakpointPairs
    const currentBreakpointIndex = breakpointPairs
        .findIndex(([key]) => key === breakpoint)

    const availableBreakpoints = breakpointPairs
        .filter(([key], index) => index < currentBreakpointIndex && key in value)
        .map(([key]) => key)

    return value[availableBreakpoints[availableBreakpoints.length - 1] as keyof UnistylesBreakpoints & string]
}
