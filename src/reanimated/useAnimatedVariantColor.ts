import { useEffect, useLayoutEffect } from 'react'
import { interpolateColor, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { StyleSheet, UnistyleDependency } from '../specs'

type ColorKeys<T> = {
    [K in keyof T]: K extends string
        ? K extends `${string}color${string}` | `${string}Color${string}`
            ? K
            : never
        : never
}[keyof T]

export const useAnimatedVariantColor = <T extends Record<string, any>>(style: T, colorKey: ColorKeys<T>) => {
    const secretKey = Object.keys(style).find(key => key.startsWith('unistyles_'))
    // @ts-ignore this is hidden from TS
    const hasVariants = style[secretKey]?.__stylesheetVariants

    if (!hasVariants || !colorKey.toLowerCase().includes('color')) {
        throw new Error('useAnimatedVariantColor: Style was not created by Unistyles, does not have variants or has no color property')
    }

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                // @ts-ignore
                const newStyles = style[secretKey]?.uni__getStyles()

                animate(toValue.value, newStyles[colorKey])
            }
        })

        return () => dispose()
    }, [style, colorKey])

    const progress = useSharedValue(1)
    const fromValue = useSharedValue<string>(style[colorKey])
    const toValue = useSharedValue<string>(style[colorKey])
    const animate = (from: string, to: string) => {
        'worklet'

        fromValue.value = from
        toValue.value = to
    }

    const derivedColor = useDerivedValue(() => {
        return interpolateColor(
            progress.value,
            [0, 1],
            [fromValue.value, toValue.value]
        )
    })

    useLayoutEffect(() => {
        animate(toValue.value, style[colorKey])
    }, [style, colorKey])

    return derivedColor
}
