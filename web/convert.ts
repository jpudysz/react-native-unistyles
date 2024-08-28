import type { NestedCSSProperties } from 'typestyle/lib/types'
import type { UnistylesValues } from '../src/types'
import { media } from 'typestyle'
import { UnistylesState } from './state'
import { keyInObject } from './utils'

export const convertBreakpoint = (breakpoint: string) => {
    // TODO: Parse mq's
    return {
        minWidth: UnistylesState.breakpoints && keyInObject(UnistylesState.breakpoints, breakpoint) ? UnistylesState.breakpoints[breakpoint] : undefined,
    }
}

export const convertToTypeStyle = (value: UnistylesValues) => {
    return Object.entries(value).flatMap(([unistylesKey, unistylesValue]) => {
        if (typeof unistylesValue === 'object' && unistylesValue !== null) {
            return Object.entries(unistylesValue).map(([breakpointKey, breakpointValue]) => {
                return media(convertBreakpoint(breakpointKey), {
                    [unistylesKey]: breakpointValue
                })
            })
        }

        return {
            [unistylesKey]: unistylesValue
        }
    }) as Array<NestedCSSProperties>
}
