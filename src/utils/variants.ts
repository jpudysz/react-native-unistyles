import type { Optional, StyleSheet, NestedStyle } from '../types'

const getKeysForVariants = (
    value: Record<string, NestedStyle>,
    variants: Array<[string, Optional<string>]>
): Array<[string, string]> => {
    // case for no specified variants by user, we should fallback to 'default'
    if (!variants.length) {
        return Object
            .entries(value)
            .map(([key, value]) => {
                if ('default' in value) {
                    return [key, 'default']
                }

                return undefined
            })
            .filter(Boolean) as Array<[string, string]>
    }

    return variants
        .map(([variantKey, variantValue]) => {
            const variantStyle = value[variantKey]

            if (variantStyle && variantValue && variantValue in variantStyle) {
                return [variantKey, variantValue]
            }

            if (variantStyle && 'default' in variantStyle) {
                return [variantKey, 'default']
            }

            return undefined
        })
        .filter(Boolean) as Array<[string, string]>
}

export const getStyleWithVariants = (
    style: StyleSheet,
    variantValues?: Record<string, Optional<string>>
) => {
    if (!('variants' in style)) {
        return style
    }

    const keys = getKeysForVariants(
        style.variants as Record<string, NestedStyle>,
        Object.entries(variantValues || {})
    )

    const variantsValues = keys
        .map(([key, nestedKey]) => ((style.variants as Record<string, Record<string, NestedStyle>>)[key] as Record<string, NestedStyle>)[nestedKey])
        .reduce((acc, styles) => ({ ...acc, ...styles }), {})

    const { variants, ...otherStyles } = style

    return {
        ...otherStyles,
        ...variantsValues
    }
}
