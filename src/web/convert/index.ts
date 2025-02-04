import type { UnistylesValues } from '../../types'
import { deepMergeObjects } from '../../utils'
import { getBoxShadow, getFilterStyle, getTransformStyle } from './object'
import { isPseudo } from './pseudo'
import { getBoxShadowStyle, getTextShadowStyle } from './shadow'
import { getStyle } from './style'
import { isBoxShadow, isFilter, isShadow, isTextShadow, isTransform } from './utils'

export const convertUnistyles = (value: UnistylesValues) => {
    // Flag to mark if textShadow is already created
    let hasTextShadow = false
    // Flag to mark if boxShadow is already created
    let hasShadow = false

    const stylesArray = Object.entries({
        ...value,
        ...value._web,
    }).flatMap(([unistylesKey, unistylesValue]) => {
        // Keys to omit
        if (
            [
                '_classNames',
                '_web',
                'variants',
                'compoundVariants',
                'uni__dependencies',
                '__unistyles-secrets__',
            ].includes(unistylesKey) ||
            unistylesKey.startsWith('variant-')
        ) {
            return []
        }

        // Pseudo classes :hover, :before etc.
        if (isPseudo(unistylesKey)) {
            const flattenValues = convertUnistyles(unistylesValue as UnistylesValues)

            return { [unistylesKey]: flattenValues }
        }

        // Text shadow
        if (isTextShadow(unistylesKey)) {
            if (hasTextShadow) {
                return []
            }

            hasTextShadow = true

            return getTextShadowStyle(value)
        }

        // RN shadows
        if (isShadow(unistylesKey)) {
            if (hasShadow) {
                return []
            }

            hasShadow = true

            return getBoxShadowStyle(value)
        }

        if (isFilter(unistylesKey, unistylesValue)) {
            return getFilterStyle(unistylesValue)
        }

        if (isBoxShadow(unistylesKey, unistylesValue)) {
            return getBoxShadow(unistylesValue)
        }

        // Transforms
        if (isTransform(unistylesKey, unistylesValue)) {
            return getTransformStyle(unistylesValue)
        }

        // Breakpoints
        if (typeof unistylesValue === 'object' && unistylesValue !== null) {
            return Object.entries(unistylesValue).map(([breakpointKey, breakpointValue]) => {
                return { [breakpointKey]: getStyle(unistylesKey, breakpointValue) }
            })
        }

        // Regular styles
        return getStyle(unistylesKey, unistylesValue)
    }) as Array<Record<string, any>>

    return deepMergeObjects(...stylesArray)
}
