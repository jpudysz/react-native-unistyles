import type { NestedCSSProperties } from 'typestyle/lib/types'
import type { UnistylesValues } from '../../src/types'
import { media } from 'typestyle'
import { isPseudo } from '../pseudo'
import { convertBreakpoint } from './breakpoint'
import { getStyle } from './style'
import { deepMergeObjects } from '../utils'
import { getTransformStyle } from './transform'
import { isBoxShadow, isTextShadow, isTransform } from './utils'
import { getTextShadowStyle } from './textShadow'
import { getBoxShadowStyle } from './boxShadow'

export const convertToTypeStyle = (value: UnistylesValues) => {
    // Flag to mark if textShadow is already created
    let hasTextShadow = false
    // Flag to mark if boxShadow is already created
    let hasBoxShadow = false

    const stylesArray = Object.entries({
        ...value,
        ...value._web
    }).flatMap(([unistylesKey, unistylesValue]) => {
        // Keys to omit
        if (['_css', '_web', 'variants', 'compoundVariants'].includes(unistylesKey)) {
            return []
        }

        // Pseudo classes :hover, :before etc.
        if (isPseudo(unistylesKey)) {
            const typestyleValues = convertToTypeStyle(unistylesValue as UnistylesValues)

            return {
                $nest: {
                    [unistylesKey.replace('_', '&:')]: typestyleValues
                }
            }
        }

        // Text shadow
        if (isTextShadow(unistylesKey)) {
            if (hasTextShadow) {
                return []
            }

            hasTextShadow = true

            return getTextShadowStyle(value)
        }

        // Box shadow
        if (isBoxShadow(unistylesKey)) {
            if (hasBoxShadow) {
                return []
            }

            hasBoxShadow = true

            return getBoxShadowStyle(value)
        }

        // Transforms
        if (isTransform(unistylesKey, unistylesValue)) {
            return getTransformStyle(unistylesValue)
        }

        // Breakpoints
        if (typeof unistylesValue === 'object' && unistylesValue !== null) {
            return Object.entries(unistylesValue).map(([breakpointKey, breakpointValue]) => {
                return media(convertBreakpoint(breakpointKey), getStyle(unistylesKey, breakpointValue))
            })
        }

        // Regular styles
        return getStyle(unistylesKey, unistylesValue)
    }) as Array<NestedCSSProperties>

    return deepMergeObjects(...stylesArray)
}
