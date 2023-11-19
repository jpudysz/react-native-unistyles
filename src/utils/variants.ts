import type { Optional, CustomNamedStyles, NestedStyle } from '../types'

const getKeyForVariant = (value: Record<string, NestedStyle>, variant?: string): Optional<string> => {
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
        style.variants as Record<string, NestedStyle>,
        variant
    )
    const variantValue = variantKey
        ? (style.variants as Record<string, NestedStyle>)[variantKey]
        : {}

    const { variants, ...otherStyles } = style

    return {
        ...otherStyles,
        ...variantValue
    }
}
