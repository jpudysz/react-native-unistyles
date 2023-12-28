// based on react-native-web normalizer
// https://github.com/necolas/react-native-web
import normalizeColors from '@react-native/normalize-colors'
import type { TextShadow, Transforms, BoxShadow, Nullable } from '../types'

type Preprocessor = {
    createTextShadowValue(style: TextShadow): string,
    createBoxShadowValue(style: Required<BoxShadow>): string,
    createTransformValue(transforms: Required<Transforms>): string,
}

export const normalizeColor = (color: string, opacity: number = 1) => {
    // If the opacity is 1 there's no need to normalize the color
    if (opacity === 1) {
        return color
    }

    const integer = normalizeColors(color) as Nullable<number>

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

        return `rgba(${r},${g},${b},${((a as number) / 255) * opacity})`
    }

    return color
}

export const normalizeNumericValue = (value: number) => value ? `${value}px` : value

const normalizeTransform = <T>(key: string, value: T) => {
    if (key.includes('scale')) {
        return value
    }

    if (typeof value === 'number') {
        return normalizeNumericValue(value)
    }

    return value
}

const createTextShadowValue = (style: TextShadow) => {
    // at this point every prop is present
    const { textShadowColor, textShadowOffset, textShadowRadius } = style
    const offsetX = normalizeNumericValue(textShadowOffset.width)
    const offsetY = normalizeNumericValue(textShadowOffset.height)
    const radius = normalizeNumericValue(textShadowRadius)
    const color = normalizeColor(textShadowColor as string)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

const createBoxShadowValue = (style: BoxShadow) => {
    // at this point every prop is present
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = style
    const offsetX = normalizeNumericValue(shadowOffset.width)
    const offsetY = normalizeNumericValue(shadowOffset.height)
    const radius = normalizeNumericValue(shadowRadius)
    const color = normalizeColor(shadowColor as string, shadowOpacity as number)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

const createTransformValue = (transforms: Transforms) => transforms
    .map(transform => {
        const [key] = Object.keys(transform)

        if (!key) {
            return undefined
        }

        const value = transform[key as keyof typeof transform]

        switch(key) {
            case 'matrix':
            case 'matrix3d':
                return `${key}(${(value as Array<number>).join(',')})`
            default:
                return `${key}(${normalizeTransform(key, value)})`
        }
    })
    .filter(Boolean)
    .join(' ')

export const preprocessor: Preprocessor = {
    createTextShadowValue,
    createBoxShadowValue,
    createTransformValue
}
