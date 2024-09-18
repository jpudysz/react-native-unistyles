import { useMemo, useRef } from 'react'
import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet, StyleSheet } from '../src/types'
import { deepMergeObjects, equal, reduceObject } from './utils'
import { UnistylesRegistry } from './registry'

type StylesWithVariants = {
    variants: Record<string, any>,
    compoundVariants?: Array<Record<string, any> & {
        styles: Record<string, any>
    }>
}

const hasVariants = <T extends object>(value: [string, T]): value is [string, T & StylesWithVariants] => 'variants' in value[1]

const hasClassName = <T extends object | undefined>(value: T): value is T & { 'unistyles-class': string } => value && 'unistyles-class' in value

export const createUseVariants = (styles: ReactNativeStyleSheet<StyleSheet>) => {
    const useVariants = (selectedVariants: Record<string, any>) => {
        const unistylesRef = useRef<TypeStyle>()
        const classNameRef = useRef<string>()
        const selectedVariantStylesRef = useRef<Record<string, any>>()
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

                    selectedVariantStylesRef.current = mergedVariantStyles

                    return [key, mergedVariantStyles] as const
                })
        }, [lastSelectedVariantsRef.current])

        if (!unistylesRef.current) {
            combinedVariantStyles.forEach(([key, value]) => {
                const { className, unistyles } = UnistylesRegistry.createStyles(value, `variant-${key}`)

                unistylesRef.current = unistyles
                classNameRef.current = className
            })
        }

        combinedVariantStyles.forEach(([key, value]) => {
            const styleEntry = styles[key]

            if (!hasClassName(styleEntry)) {
                return
            }

            if (variantsChanged) {
                UnistylesRegistry.updateStyles(unistylesRef.current!, value, classNameRef.current!)
            }

            Object.defineProperties(styleEntry, reduceObject(selectedVariantStylesRef.current ?? {}, value => ({
                value,
                enumerable: false,
                configurable: true
            })))
            styleEntry['unistyles-class'] = `${styleEntry['unistyles-class'].replace(/variant-[^\s]+/g, '').trim()} ${classNameRef.current}`
        })
    }

    Object.defineProperty(styles, 'useVariants', {
        value: useVariants
    })
}
