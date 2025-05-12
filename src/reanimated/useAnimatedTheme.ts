import { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { UnistyleDependency, UnistylesRuntime, StyleSheet } from '../specs'
import type { UnistylesTheme } from '../types'

export const useAnimatedTheme = () => {
    const theme = useSharedValue<UnistylesTheme>(UnistylesRuntime.getTheme())

    useEffect(() => {
        // @ts-ignore this is hidden from TS
        const dispose = StyleSheet.addChangeListener(changedDependencies => {
            if (changedDependencies.includes(UnistyleDependency.Theme)) {
                theme.set(UnistylesRuntime.getTheme())
            }
        })

        return () => dispose()
    }, [])

    return theme
}
