import { useEffect, useLayoutEffect } from 'react'
import { runOnUI, useSharedValue } from 'react-native-reanimated'
import { StyleSheet, UnistyleDependency } from '../../specs'
import type { UseUpdateVariantColorConfig } from './types'

export const useUpdateVariantColor = <T extends Record<string, any>>({
    animateCallback,
    colorKey,
    style,
    secretKey
}: UseUpdateVariantColorConfig<T>) => {
    const fromValue = useSharedValue<string>(style[colorKey])
    const toValue = useSharedValue<string>(style[colorKey])

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                // @ts-ignore
                const newStyles = style[secretKey]?.uni__getStyles()

                runOnUI(() => {
                    animateCallback(toValue.value, newStyles[colorKey])
                })()
            }
        })

        return () => dispose()
    }, [style, colorKey])

    useLayoutEffect(() => {
        animateCallback(toValue.value, style[colorKey])
    }, [style, colorKey])

    return {
        fromValue,
        toValue
    }
}
