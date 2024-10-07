import { useMemo, useRef, useState } from 'react'
import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet, StyleSheet } from '../../types'
import { equal, reduceObject } from '../utils'
import { UnistylesRegistry } from '../registry'
import { getVariants } from './getVariants'

export const createUseVariants = (styles: ReactNativeStyleSheet<StyleSheet>, setSelectedVariants: (variants: Record<string, any>) => void) => {
    const useVariants = (selectedVariants: Record<string, any>) => {
        const [unistylesMap] = useState(() => new Map<string, TypeStyle>())
        const [classNameMap] = useState(() => new Map<string, string>())
        const [selectedVariantStylesMap] = useState(() => new Map<string, Record<string, any>>())
        const lastSelectedVariantsRef = useRef<Record<string, any>>()
        // Variable that determines if variants have changed and we need to recalculate styles
        const variantsChanged = !equal(lastSelectedVariantsRef.current, selectedVariants)

        if (variantsChanged) {
            lastSelectedVariantsRef.current = selectedVariants
            setSelectedVariants(selectedVariants)
        }

        const combinedVariantStyles = useMemo(() => {
            const result = getVariants(styles, selectedVariants)

            result.forEach(([key, value]) => {
                selectedVariantStylesMap.set(key, value)
            })

            return result
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
