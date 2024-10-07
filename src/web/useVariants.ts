import { useMemo, useRef, useState } from 'react'
import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet, StyleSheet } from '../types'
import { deepMergeObjects, equal, reduceObject } from './utils'
import { UnistylesRegistry } from './registry'

type StylesWithVariants = {
    variants: Record<string, any>,
    compoundVariants?: Array<Record<string, any> & {
        styles: Record<string, any>
    }>
}

const hasVariants = <T extends object>(value: [string, T]): value is [string, T & StylesWithVariants] => 'variants' in value[1]

export const createUseVariants = (styles: ReactNativeStyleSheet<StyleSheet>) => {
    const useVariants = (selectedVariants: Record<string, any>) => {
        const [unistylesMap] = useState(() => new Map<string, TypeStyle>())
        const [classNameMap] = useState(() => new Map<string, string>())
        const [selectedVariantStylesMap] = useState(() => new Map<string, Record<string, any>>())
        const lastSelectedVariantsRef = useRef<Record<string, any>>()
        // Variable that determines if variants have changed and we need to recalculate styles
        const variantsChanged = !equal(lastSelectedVariantsRef.current, selectedVariants)

        if (variantsChanged) {
            lastSelectedVariantsRef.current = selectedVariants
        }

        const combinedVariantStyles = useMemo(() => {
            return Object.entries(styles)
                .filter(hasVariants)
                .filter(([_key, { variants }]) => Object.keys(variants).some(variant => variant in variants))
                .map(([key, { variants, compoundVariants = [] }]) => {
                    const variantStyles = Object.entries(variants).flatMap(([variant, styles]) => {
                        const selectedVariant = selectedVariants[variant]
                        const selectedVariantStyles = styles[selectedVariant] ?? styles['default']

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

                    selectedVariantStylesMap.set(key, mergedVariantStyles)

                    return [key, mergedVariantStyles] as const
                })
        }, [lastSelectedVariantsRef.current])

        if (unistylesMap.size === 0 && combinedVariantStyles.length > 0) {
            combinedVariantStyles.forEach(([key, value]) => {
                const { className, unistyles } = UnistylesRegistry.createStyles(value, `variant-${key}`)

                unistylesMap.set(key, unistyles)
                classNameMap.set(key, className)
            })
        }

        combinedVariantStyles.forEach(([key, value]) => {
            const styleEntry = styles[key]
            const unistyles = unistylesMap.get(key)
            const className = classNameMap.get(key)
            const selectedVariantStyles = selectedVariantStylesMap.get(key)

            if (!unistyles || !className) {
                return
            }

            if (variantsChanged) {
                UnistylesRegistry.updateStyles(unistyles, value, className)
            }

            Object.defineProperties(styleEntry, reduceObject(selectedVariantStyles ?? {}, value => ({
                value,
                enumerable: false,
                configurable: true
            })))


            if (styleEntry) {
                Object.keys(styleEntry ?? {}).forEach(key => {
                    if (!key.startsWith('variant-')) {
                        return
                    }

                    // @ts-expect-error - remove old variants
                    delete styleEntry[key]
                })
                // @ts-expect-error - apply variant className
                styleEntry[className] = className
            }
        })
    }

    Object.defineProperty(styles, 'useVariants', {
        value: useVariants
    })
}
