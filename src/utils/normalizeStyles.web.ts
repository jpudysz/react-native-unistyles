import { warn } from './common'

const preprocessor: Preprocessor = require('react-native-web/src/exports/StyleSheet/preprocess.js')

type Preprocessor = {
    createTextShadowValue<T>(styles: any): T,
    createBoxShadowValue<T>(styles: any): T,
    createTransformValue<T>(transforms: any): T,
}

type NormalizedBoxShadow = {
    shadowColor: undefined,
    shadowOffset: undefined,
    shadowOpacity: undefined,
    shadowRadius: undefined,
    boxShadow?: string
}

type NormalizedTextShadow = {
    textShadowColor: undefined
    textShadowOffset: undefined
    textShadowRadius: undefined,
    textShadow?: string
}

const normalizeBoxShadow = <T extends {}>(styles: T): NormalizedBoxShadow => {
    const requiredBoxShadowProperties = [
        'shadowColor',
        'shadowOffset',
        'shadowOpacity',
        'shadowRadius'
    ]

    if (!requiredBoxShadowProperties.every(prop => prop in styles)) {
        warn(`can't apply box shadow as you miss at least one of these properties: ${requiredBoxShadowProperties.join(', ')}`)

        return {
            shadowColor: undefined,
            shadowOffset: undefined,
            shadowOpacity: undefined,
            shadowRadius: undefined
        }
    }

    return {
        boxShadow: preprocessor.createBoxShadowValue(styles),
        shadowColor: undefined,
        shadowOffset: undefined,
        shadowOpacity: undefined,
        shadowRadius: undefined
    }
}

const normalizeTextShadow = <T extends {}>(styles: T): NormalizedTextShadow => {
    const requiredTextShadowProperties = [
        'textShadowColor',
        'textShadowOffset',
        'textShadowRadius'
    ]

    if (!requiredTextShadowProperties.every(prop => prop in styles)) {
        warn(`can't apply text shadow as you miss at least one of these properties: ${requiredTextShadowProperties.join(', ')}`)

        return {
            textShadowColor: undefined,
            textShadowOffset: undefined,
            textShadowRadius: undefined
        }
    }

    return {
        textShadow: preprocessor.createTextShadowValue(styles),
        textShadowColor: undefined,
        textShadowOffset: undefined,
        textShadowRadius: undefined
    }
}

export const normalizeStyles = <T extends {}>(styles: T): T => {
    const normalizedTransform = ('transform' in styles && Array.isArray(styles.transform))
        ? { transform: preprocessor.createTransformValue(styles.transform) }
        : {}

    const normalizedBoxShadow = (
        'shadowColor' in styles ||
        'shadowOffset' in styles ||
        'shadowOpacity' in styles ||
        'shadowRadius' in styles
    ) ? normalizeBoxShadow(styles) : {}

    const normalizedTextShadow = (
        'textShadowColor' in styles ||
        'textShadowOffset' in styles ||
        'textShadowRadius' in styles
    ) ? normalizeTextShadow(styles) : {}

    return {
        ...styles,
        ...normalizedTransform,
        ...normalizedBoxShadow,
        ...normalizedTextShadow
    }
}
