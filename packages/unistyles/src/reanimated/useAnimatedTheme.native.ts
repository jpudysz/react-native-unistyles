import { useContext, useEffect, useState } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

import type { UnistylesTheme } from '../types'

import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'

export const useAnimatedTheme = () => {
    const scope = useContext(ScopedThemeContext)
    const [scopedTheme, setScopedTheme] = useState(scope?.name as UnistylesTheme | undefined)
    const theme = useSharedValue(UnistylesRuntime.getTheme(scopedTheme))

    // Follow the closest ScopedTheme, see useProxifiedUnistyles
    if (scope && scopedTheme !== scope.name) {
        setScopedTheme(scope.name as UnistylesTheme | undefined)
        theme.set(UnistylesRuntime.getTheme(scope.name as UnistylesTheme | undefined))
    }

    useEffect(() => {
        const dispose = StyleSheet.addChangeListener((changedDependencies) => {
            if (!changedDependencies.includes(UnistyleDependency.Theme)) {
                return
            }

            if (scopedTheme) {
                return
            }

            theme.set(UnistylesRuntime.getTheme())
        })

        return () => dispose()
    }, [scopedTheme])

    return theme as SharedValue<UnistylesTheme>
}
