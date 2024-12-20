import type { ReactNativeStyleSheet, StyleSheet } from '../types'
import { deepMergeObjects, isDefined } from '../utils'

type StylesWithVariants = {
    variants: Record<string, any>,
    compoundVariants?: Array<Record<string, any> & {
        styles: Record<string, any>
    }>
}
const hasVariants = <T extends object>(value: [string, T]): value is [string, T & StylesWithVariants] => {
    const [, styleValue] = value

    return isDefined(styleValue) && 'variants' in styleValue
}

export const getVariants = (styles: ReactNativeStyleSheet<StyleSheet>, selectedVariants: Record<string, any>) => {
    return Object.entries(styles)
        .filter(hasVariants)
        .filter(([_key, { variants }]) => Object.keys(variants).some(variant => variant in variants))
        .map(([key, { variants, compoundVariants = [] }]) => {
            const variantStyles = Object.entries(variants).flatMap(([variant, styles]) => {
                const selectedVariant = selectedVariants[variant]
                const selectedVariantStyles = styles[selectedVariant] ?? styles.default

                if (!selectedVariantStyles) {
                    return []
                }

                return selectedVariantStyles
            })

            const compoundVariantStyles = compoundVariants.flatMap(compoundVariant => {
                const { styles, ...conditions } = compoundVariant

                if (Object.entries(conditions).some(([variant, value]) => String(selectedVariants[variant]) !== String(value))) {
                    return []
                }

                return styles
            })

            const mergedVariantStyles = deepMergeObjects(...variantStyles, ...compoundVariantStyles)

            return [key, mergedVariantStyles] as const
        })
}
