import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSharedValue } from 'react-native-reanimated'

import type { UseUpdateVariantColorConfig } from './types'

import { StyleSheet, UnistyleDependency } from '../../specs'

export const useUpdateVariantColor = <T extends Record<string, any>>({
    colorKey,
    style,
    secretKey,
}: UseUpdateVariantColorConfig<T>) => {
    const fromValue = useSharedValue<string>(style[colorKey])
    const toValue = useSharedValue<string>(style[colorKey])
    const applied = useRef<{ style: T; colorKey: typeof colorKey }>(undefined)

    useEffect(() => {
        const dispose = StyleSheet.addChangeListener((changedDependencies) => {
            if (
                changedDependencies.includes(UnistyleDependency.Theme) ||
                changedDependencies.includes(UnistyleDependency.Breakpoints)
            ) {
                // @ts-ignore
                const newStyles = style[secretKey]?.uni__getStyles()

                fromValue.set(toValue.value)
                toValue.set(newStyles[colorKey])
            }
        })

        return () => dispose()
    }, [style, colorKey])

    useLayoutEffect(() => {
        if (applied.current?.style === style && applied.current.colorKey === colorKey) {
            return
        }

        applied.current = { style, colorKey }
        fromValue.set(toValue.value)
        toValue.set(style[colorKey])
    }, [style, colorKey])

    return {
        fromValue,
        toValue,
    }
}
