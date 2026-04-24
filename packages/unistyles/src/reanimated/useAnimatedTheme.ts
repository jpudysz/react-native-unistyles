import { useEffect, useState } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

import type { UnistylesTheme } from '../types'

import { UnistyleDependency, UnistylesRuntime, UnistylesShadowRegistry } from '../specs'
import { services } from '../web/services'

export const useAnimatedTheme = () => {
    const [scopedTheme, setScopedTheme] = useState(
        () => UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme | undefined,
    )
    const theme = useSharedValue(UnistylesRuntime.getTheme(scopedTheme))
    const maybeNewScopedTheme = UnistylesShadowRegistry.getScopedTheme() as UnistylesTheme | undefined

    if (scopedTheme !== maybeNewScopedTheme) {
        setScopedTheme(maybeNewScopedTheme)
        theme.set(UnistylesRuntime.getTheme(maybeNewScopedTheme))
    }

    useEffect(() => {
        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () => {
            if (scopedTheme) {
                return
            }

            theme.set(UnistylesRuntime.getTheme())
        })

        return () => {
            dispose()
        }
    }, [scopedTheme])

    return theme as SharedValue<UnistylesTheme>
}
