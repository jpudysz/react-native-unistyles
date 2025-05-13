import { useEffect } from 'react'
import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'
import type { UnistylesTheme } from '../types'

export const useAnimatedTheme = () => {
    const theme = useSharedValue(UnistylesRuntime.getTheme())

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                theme.set(UnistylesRuntime.getTheme())
            }
        })

        return () => dispose()
    }, [])

    return theme as SharedValue<UnistylesTheme>
}
