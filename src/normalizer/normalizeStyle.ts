import { preprocessor } from './normalizer'
import { warn } from '../common'
import type { NormalizedBoxShadow, NormalizedTextShadow, BoxShadow, TextShadow, RNStyle } from '../types'

const normalizeBoxShadow = <T extends BoxShadow>(style: T): NormalizedBoxShadow => {
    const requiredBoxShadowProperties = [
        'shadowColor',
        'shadowOffset',
        'shadowOpacity',
        'shadowRadius'
    ]

    if (!requiredBoxShadowProperties.every(prop => prop in style)) {
        warn(`can't apply box shadow as you miss at least one of these properties: ${requiredBoxShadowProperties.join(', ')}`)

        return {
            shadowColor: undefined,
            shadowOffset: undefined,
            shadowOpacity: undefined,
            shadowRadius: undefined
        }
    }

    return {
        boxShadow: preprocessor.createBoxShadowValue(style),
        shadowColor: undefined,
        shadowOffset: undefined,
        shadowOpacity: undefined,
        shadowRadius: undefined
    }
}

const normalizeTextShadow = <T extends TextShadow>(style: T): NormalizedTextShadow => {
    const requiredTextShadowProperties = [
        'textShadowColor',
        'textShadowOffset',
        'textShadowRadius'
    ]

    if (!requiredTextShadowProperties.every(prop => prop in style)) {
        warn(`can't apply text shadow as you miss at least one of these properties: ${requiredTextShadowProperties.join(', ')}`)

        return {
            textShadowColor: undefined,
            textShadowOffset: undefined,
            textShadowRadius: undefined
        }
    }

    return {
        textShadow: preprocessor.createTextShadowValue(style),
        textShadowColor: undefined,
        textShadowOffset: undefined,
        textShadowRadius: undefined
    }
}

export const normalizeStyle = <T extends RNStyle>(style: T): T => {
    const normalizedTransform = ('transform' in style && Array.isArray(style.transform))
        ? { transform: preprocessor.createTransformValue(style.transform) }
        : {}

    const normalizedBoxShadow = (
        'shadowColor' in style ||
        'shadowOffset' in style ||
        'shadowOpacity' in style ||
        'shadowRadius' in style
    ) ? normalizeBoxShadow(style as BoxShadow) : {}

    const normalizedTextShadow = (
        'textShadowColor' in style ||
        'textShadowOffset' in style ||
        'textShadowRadius' in style
    ) ? normalizeTextShadow(style as TextShadow) : {}

    return {
        ...style,
        ...normalizedTransform,
        ...normalizedBoxShadow,
        ...normalizedTextShadow
    }
}
