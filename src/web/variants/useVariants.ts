import { useMemo, useRef, useState } from 'react'
import type { ReactNativeStyleSheet, StyleSheet } from '../../types'
import { equal, reduceObject } from '../utils'
import { getVariants } from './getVariants'

export const createUseVariants = (styles: ReactNativeStyleSheet<StyleSheet>, setSelectedVariants: (variants: Record<string, any>) => void) => {
    const useVariants = (selectedVariants: Record<string, any>) => {
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

        combinedVariantStyles.forEach(([key]) => {
            const styleEntry = styles[key]
            const selectedVariantStyles = selectedVariantStylesMap.get(key)

            Object.defineProperties(styleEntry, reduceObject(selectedVariantStyles ?? {}, value => ({
                value,
                enumerable: false,
                configurable: true
            })))
        })
    }

    Object.defineProperty(styles, 'useVariants', {
        value: useVariants
    })
}
