// based on react-native-web normalizer
// https://github.com/necolas/react-native-web
/// <reference path="module.d.ts" />
import normalizeColors from '@react-native/normalize-colors'
import type { BoxShadowValue } from 'react-native'
import type { TransformStyles } from '../../types/core'
import { type AllShadow, type AllShadowKeys, BOX_SHADOW_STYLES, type Filters, TEXT_SHADOW_STYLES } from './types'

export const isTransform = (key: string, value: any): value is Array<TransformStyles> => key === 'transform' && Array.isArray(value)

export const isTextShadow = (key: string) => TEXT_SHADOW_STYLES.includes(key as typeof TEXT_SHADOW_STYLES[number])

export const isShadow = (key: string) => BOX_SHADOW_STYLES.includes(key as typeof BOX_SHADOW_STYLES[number])

export const isFilter = (key: string, value: any): value is Array<Filters> => key === 'filter' && Array.isArray(value)

export const isBoxShadow = (key: string, value: any): value is Array<BoxShadowValue> => key === 'boxShadow' && Array.isArray(value)

export const normalizeNumericValue = (value: number | string) => value && typeof value === 'number' ? `${value}px` : value

export const normalizeColor = (color: string, opacity = 1) => {
    // If the opacity is 1 there's no need to normalize the color
    if (opacity === 1) {
        return color
    }

    const integer = normalizeColors(color)

    // If the color is an unknown format, the return value is null
    if (integer === null) {
        return color
    }

    const hex = integer.toString(16).padStart(8, '0') as string

    if (hex.length === 8) {
        const [r = 0, g = 0, b = 0, a = 1] = hex
            .split(/(?=(?:..)*$)/)
            .map(x => Number.parseInt(x, 16))
            .filter(num => !Number.isNaN(num))

        return `rgba(${r},${g},${b},${(a / 255) * opacity})`
    }

    return color
}

export const extractShadowValue = <TKey extends AllShadowKeys>(key: TKey, breakpoint: string, styles: any): AllShadow[TKey] => {
    const value = styles[key]

    if (key === 'textShadowOffset' || key === 'shadowOffset') {
        const { width, height } = value

        return {
            width: typeof width === 'object' ? width[breakpoint] : width,
            height: typeof height === 'object' ? height[breakpoint] : height
        } as AllShadow[TKey]
    }

    return typeof value === 'object' ? value[breakpoint] : value
}
