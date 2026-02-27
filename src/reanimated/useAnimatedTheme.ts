import { useEffect } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

import type { UnistylesTheme } from '../types'

import { UnistyleDependency, UnistylesRuntime } from '../specs'
import { services } from '../web/services'

export const useAnimatedTheme = () => {
    const theme = useSharedValue(UnistylesRuntime.getTheme())

    useEffect(() => {
        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () =>
            theme.set(UnistylesRuntime.getTheme()),
        )

        return () => {
            dispose()
        }
    }, [])

    return theme as SharedValue<UnistylesTheme>
}
