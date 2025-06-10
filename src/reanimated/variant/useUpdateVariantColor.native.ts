import { useEffect, useLayoutEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import type { UseUpdateVariantColorConfig } from './types'
import { StyleSheet, UnistyleDependency } from '../../specs'

export const useUpdateVariantColor = <T extends Record<string, any>>({
    colorKey,
    style,
    secretKey
}: UseUpdateVariantColorConfig<T>) => {
    const fromValue = useSharedValue<string>(style[colorKey])
    const toValue = useSharedValue<string>(style[colorKey])

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme) || changedDependencies.includes(UnistyleDependency.Breakpoints)) {
                // @ts-ignore
                const newStyles = style[secretKey]?.uni__getStyles()

                fromValue.value = toValue.value
                toValue.value = newStyles[colorKey]
            }
        })

        return () => dispose()
    }, [style, colorKey])

    useLayoutEffect(() => {
        fromValue.value = toValue.value
        toValue.value = style[colorKey]
    }, [style, colorKey])

    return {
        fromValue,
        toValue
    }
}
