import { useEffect, useLayoutEffect } from 'react'
import { cancelAnimation, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated'
import { StyleSheet, UnistyleDependency } from '../specs'

export const useAnimatedVariants = <T extends Record<string, any>>(style: T, animationConfig?: WithTimingConfig | WithSpringConfig) => {
    const secretKey = Object.keys(style).find(key => key.startsWith('unistyles_'))
    // @ts-ignore this is hidden from TS
    const hasVariants = style[secretKey]?.__stylesheetVariants

    if (!hasVariants) {
        throw new Error('useAnimatedVariants: Style was not created by Unistyles or does not have variants')
    }

    const progress = useSharedValue(1)
    const fromValue = useSharedValue(style)
    const toValue = useSharedValue(style)

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                // @ts-ignore
                const newStyles = style[secretKey]?.uni__getStyles()

                fromValue.set(newStyles)
                toValue.set(newStyles)
            }
        })

        return () => dispose()
    }, [style])

    useLayoutEffect(() => {
        cancelAnimation(progress)
        progress.value = 0

        fromValue.set(toValue.get())
        toValue.set(style)

        if (!animationConfig) {
            progress.value = withTiming(1, {
                duration: 500
            })

            return
        }

        if (animationConfig.duration) {
            progress.value = withTiming(1, animationConfig as WithTimingConfig)

            return
        }

        progress.value = withSpring(1, animationConfig as WithSpringConfig)
    }, [style])

    return {
        from: fromValue,
        to: toValue,
        progress
    }
}

