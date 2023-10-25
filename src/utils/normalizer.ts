// based on react-native-web normalizer
// https://github.com/necolas/react-native-web
import type { TextShadow, Transforms, BoxShadow } from '../types'

type Preprocessor = {
    createTextShadowValue(style: TextShadow): string,
    createBoxShadowValue(style: Required<BoxShadow>): string,
    createTransformValue(transforms: Required<Transforms>): string,
}

// for now supports
// hex colors (3, 6, 8) chars
// colors like orange red etc.
export const normalizeColor = (color: string, opacity: number = 1) => {
    if (!color.startsWith('#')) {
        return color
    }

    if (color.length === 9) {
        const [r, g, b, a] = color
            .slice(1)
            .split(/(?=(?:..)*$)/)
            .map(x => parseInt(x, 16))
            .filter(num => !isNaN(num))

        return `rgba(${r},${g},${b},${(a as number) / 255})`
    }

    const sanitizedHex = color.length === 4
        ? color
            .slice(1)
            .split('')
            .map(char => `${char}${char}`)
            .join('')
        : color.slice(1)

    return sanitizedHex
        .split(/(?=(?:..)*$)/)
        .map(x => parseInt(x, 16))
        .filter(num => !isNaN(num))
        .reduce((acc, color) => `${acc}${color},`, 'rgba(')
        .concat(`${opacity})`)
}

export const normalizeNumericValue = (value: number) => value ? `${value}px` : value
const normalizeTransform = (key: string, value: number | string) => {
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
