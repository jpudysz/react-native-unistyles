// based on react-native-web normalizer
// https://github.com/necolas/react-native-web
import normalizeColors from '@react-native/normalize-colors'
import { BOX_SHADOW_STYLES, TEXT_SHADOW_STYLES, type AllShadow, type AllShadowKeys } from './types'

export const isTransform = (key: string, value: any): value is Array<Record<string, any>> => key === 'transform' && Array.isArray(value)

export const isTextShadow = (key: string) => TEXT_SHADOW_STYLES.includes(key as typeof TEXT_SHADOW_STYLES[number])

export const isBoxShadow = (key: string) => BOX_SHADOW_STYLES.includes(key as typeof BOX_SHADOW_STYLES[number])

export const normalizeNumericValue = (value: number) => value ? `${value}px` : value

export const normalizeColor = (color: string, opacity: number = 1) => {
    // If the opacity is 1 there's no need to normalize the color
    if (opacity === 1) {
        return color
    }

    const integer = normalizeColors(color)

    // If the color is an unknown format, the return value is null
    if (integer === null) {
        return color
    }

    const hex = integer.toString(16).padStart(8, '0')

    if (hex.length === 8) {
        const [r = 0, g = 0, b = 0, a = 1] = hex
            .split(/(?=(?:..)*$)/)
            .map(x => parseInt(x, 16))
            .filter(num => !isNaN(num))

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