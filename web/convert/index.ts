import type { NestedCSSProperties } from 'typestyle/lib/types'
import type { UnistylesValues } from '../../src/types'
import { media } from 'typestyle'
import { isPseudo } from '../pseudo'
import { convertBreakpoint } from './breakpoint'
import { getStyle } from './style'
import { deepMergeObjects } from '../utils'
import { getTransformStyle } from './transform'

const isTransform = (key: string, value: any): value is Array<Record<string, any>> => key === 'transform' && Array.isArray(value)

export const convertToTypeStyle = (value: UnistylesValues) => {
    const stylesArray = Object.entries({
        ...value,
        ...value._web
    }).flatMap(([unistylesKey, unistylesValue]) => {
        if (['_css', '_web'].includes(unistylesKey)) {
            return []
        }

        if (isPseudo(unistylesKey)) {
            const typestyleValues = convertToTypeStyle(unistylesValue as UnistylesValues)

            return {
                $nest: {
                    [unistylesKey.replace('_', '&:')]: typestyleValues
                }
            }
        }

        if (isTransform(unistylesKey, unistylesValue)) {
            return getTransformStyle(unistylesValue)
        }

        if (typeof unistylesValue === 'object' && unistylesValue !== null) {
            return Object.entries(unistylesValue).map(([breakpointKey, breakpointValue]) => {
                return media(convertBreakpoint(breakpointKey), getStyle(unistylesKey, breakpointValue))
            })
        }

        return getStyle(unistylesKey, unistylesValue)
    }) as Array<NestedCSSProperties>

    return deepMergeObjects(...stylesArray)
}
