import { useContext, useEffect, useState } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

import type { UnistylesTheme } from '../types'

import { ScopedThemeContext } from '../components/ScopedThemeContext'
import { useIsHydrated } from '../core/useIsHydrated'
import { UnistyleDependency, UnistylesRuntime } from '../specs'
import { services } from '../web/services'

const getServerTheme = (): UnistylesTheme => {
    // @ts-expect-error This is hidden from TS
    return UnistylesRuntime.getServerTheme()
}

export const useAnimatedTheme = () => {
    const scope = useContext(ScopedThemeContext)
    const [scopedTheme, setScopedTheme] = useState(scope?.name as UnistylesTheme | undefined)
    // While hydrating, the theme the server rendered with, see useProxifiedUnistyles
    const isHydrated = useIsHydrated()
    const theme = useSharedValue(isHydrated || scopedTheme ? UnistylesRuntime.getTheme(scopedTheme) : getServerTheme())

    // Follow the closest ScopedTheme, see useProxifiedUnistyles
    if (scope && scopedTheme !== scope.name) {
        setScopedTheme(scope.name as UnistylesTheme | undefined)
        theme.set(UnistylesRuntime.getTheme(scope.name as UnistylesTheme | undefined))
    }

    useEffect(() => {
        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () => {
            if (scopedTheme) {
                return
            }

            theme.set(UnistylesRuntime.getTheme())
        })

        // Hydrated: the browser's theme
        if (!scopedTheme) {
            theme.set(UnistylesRuntime.getTheme())
        }

        return () => {
            dispose()
        }
    }, [scopedTheme])

    return theme as SharedValue<UnistylesTheme>
}
