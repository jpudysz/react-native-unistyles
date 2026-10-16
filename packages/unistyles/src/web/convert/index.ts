import type { UnistylesValues } from '../../types'
import type { UnistylesRuntime } from '../runtime'

import { deepMergeObjects } from '../../utils'
import {
    getBackgroundLayers,
    getBoxShadow,
    getFilterStyle,
    getFontVariationSettings,
    getTransformStyle,
} from './object'
import { isPseudo } from './pseudo'
import { getBoxShadowStyle, getTextShadowStyle } from './shadow'
import { getStyle } from './style'
import {
    isBackgroundLayer,
    isBoxShadow,
    isFilter,
    isFontVariationSettings,
    isShadow,
    isTextShadow,
    isTransform,
} from './utils'

// a breakpoint can hold React Native's array or object syntax too
const getBreakpointStyle = (key: string, value: any) => {
    if (isBackgroundLayer(key, value)) {
        return getBackgroundLayers(key, value)
    }

    if (isFontVariationSettings(key, value)) {
        return getFontVariationSettings(value)
    }

    return getStyle(key, value)
}

export const convertUnistyles = (value: UnistylesValues, runtime: UnistylesRuntime) => {
    // Flag to mark if textShadow is already created
    let hasTextShadow = false
    // Flag to mark if boxShadow is already created
    let hasShadow = false

    const stylesArray = Object.entries(value).flatMap(([unistylesKey, unistylesValue]) => {
        // Keys to omit
        if (
            ['_classNames', '_web', 'variants', 'compoundVariants', 'uni__dependencies'].includes(unistylesKey) ||
            unistylesKey.startsWith('unistyles_')
        ) {
            return []
        }

        // Pseudo classes :hover, :before etc.
        if (isPseudo(unistylesKey)) {
            const flattenValues = convertUnistyles(unistylesValue as UnistylesValues, runtime)

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
            return getFilterStyle(unistylesValue, runtime)
        }

        if (isBoxShadow(unistylesKey, unistylesValue)) {
            return getBoxShadow(unistylesValue)
        }

        // Transforms
        if (isTransform(unistylesKey, unistylesValue)) {
            return getTransformStyle(unistylesValue)
        }

        // React Native's array and object syntaxes, not breakpoints
        if (isBackgroundLayer(unistylesKey, unistylesValue)) {
            return getBackgroundLayers(unistylesKey, unistylesValue)
        }

        if (isFontVariationSettings(unistylesKey, unistylesValue)) {
            return getFontVariationSettings(unistylesValue)
        }

        // Breakpoints, arrays like fontVariant are regular values
        if (typeof unistylesValue === 'object' && unistylesValue !== null && !Array.isArray(unistylesValue)) {
            return Object.entries(unistylesValue).map(([breakpointKey, breakpointValue]) => {
                return { [breakpointKey]: getBreakpointStyle(unistylesKey, breakpointValue) }
            })
        }

        // Regular styles
        return getStyle(unistylesKey, unistylesValue)
    }) as Array<Record<string, any>>

    return deepMergeObjects(...stylesArray)
}
