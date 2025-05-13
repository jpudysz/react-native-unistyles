import { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { UnistyleDependency, UnistylesRuntime } from '../specs'
import type { UnistylesTheme } from '../types'
import { services } from '../web/services'

export const useAnimatedTheme = () => {
    const theme = useSharedValue<UnistylesTheme>(UnistylesRuntime.getTheme())

    useEffect(() => {
        const dispose = services.listener.addListeners([UnistyleDependency.Theme], () => theme.set(UnistylesRuntime.getTheme()))

        return () => {
            dispose()
        }
    }, [])

    return theme
}
