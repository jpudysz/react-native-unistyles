import type { NestedCSSProperties } from 'typestyle/lib/types'
import type { UnistylesValues } from '../src/types'
import { media } from 'typestyle'
import { UnistylesState } from './state'
import { keyInObject } from './utils'
import { isPseudo } from './pseudo'

export const convertBreakpoint = (breakpoint: string) => {
    return {
        minWidth: UnistylesState.breakpoints && keyInObject(UnistylesState.breakpoints, breakpoint) ? UnistylesState.breakpoints[breakpoint] : undefined,
    }
}

export const convertToTypeStyle = (value: UnistylesValues): Array<NestedCSSProperties> => {
    return Object.entries(value).flatMap(([unistylesKey, unistylesValue]) => {
        if (isPseudo(unistylesKey)) {
            const typestyleValues = convertToTypeStyle(unistylesValue as UnistylesValues)

            return typestyleValues.map(typeStyleValue => ({
                $nest: {
                    [unistylesKey.replace('_', '&:')]: typeStyleValue
                }
            }))
        }

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
