import { useEffect } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

import type { UnistylesTheme } from '../types'

import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'

export const useAnimatedTheme = () => {
    const theme = useSharedValue(UnistylesRuntime.getTheme())

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener((changedDependencies) => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                theme.set(UnistylesRuntime.getTheme())
            }
        })

        return () => dispose()
    }, [])

    return theme as SharedValue<UnistylesTheme>
}
