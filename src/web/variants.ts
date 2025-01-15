import type { UnistylesValues } from '../types'
import { deepMergeObjects } from '../utils'
import { keyInObject } from './utils'

type StylesWithVariants = {
    variants: Record<string, string | boolean | undefined>,
    compoundVariants?: Array<Record<string, string | boolean | undefined> & {
        styles: Record<string, any>
    }>
}
const hasVariants = (value: any): value is StylesWithVariants => {
    return keyInObject(value, 'variants')
}

export const getVariants = (styles: UnistylesValues, selectedVariants: Record<string, any>) => {
    if (!hasVariants(styles)) {
        return {}
    }

    const variantStyles = Object.entries(styles.variants).flatMap(([variant, styles]) => {
        const selectedVariant = selectedVariants[variant]
        const selectedVariantStyles = styles[selectedVariant] ?? styles.default

        if (!selectedVariantStyles) {
            return []
        }

        return selectedVariantStyles
    })

    const compoundVariantStyles = styles.compoundVariants?.flatMap(compoundVariant => {
        const { styles, ...conditions } = compoundVariant

        if (Object.entries(conditions).some(([variant, value]) => String(selectedVariants[variant]) !== String(value))) {
            return []
        }

        return styles
    }) ?? []

    return deepMergeObjects(...variantStyles, ...compoundVariantStyles)
}
