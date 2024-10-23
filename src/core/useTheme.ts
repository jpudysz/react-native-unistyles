import { useEffect, useState } from 'react'
import { UnistylesRuntime } from '../web'
import { UnistylesListener } from '../web/listener'
import { UnistyleDependency } from '../specs/NativePlatform'

export const useTheme = () => {
    const [theme, setTheme] = useState(UnistylesRuntime.getTheme())

    useEffect(() => {
        const removeChangeListener = UnistylesListener.addListeners([UnistyleDependency.Theme], () => setTheme(UnistylesRuntime.getTheme()))

        return () => {
            removeChangeListener()
        }
    }, [])

    return theme
}
