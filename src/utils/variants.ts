import type { Optional, CustomNamedStyles, StaticStyles } from '../types'

const getKeyForVariant = (value: Record<string, StaticStyles>, variant?: string): Optional<string> => {
    if (variant && variant in value) {
        return variant
    }

    if ('default' in value) {
        return 'default'
    }

    return undefined
}

export const getStyleWithVariant = <T>(
    style: CustomNamedStyles<T>,
    variant?: string
) => {
    if (!('variants' in style)) {
        return style
    }

    const variantKey = getKeyForVariant(
        style.variants as Record<string, StaticStyles>,
        variant
    )
    const variantValue = variantKey
        ? (style.variants as Record<string, StaticStyles>)[variantKey]
        : {}

    const { variants, ...otherStyles } = style

    return {
        ...otherStyles,
        ...variantValue
    }
}
