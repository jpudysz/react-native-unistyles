import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import type { CxxUnistylesSizeEvent, CxxUnistylesThemeEvent, UnistylesEvents } from './types'
import { CxxUnistylesEventTypes } from './types'
import { unistyles } from './Unistyles'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [theme, setTheme] = useState(unistyles.runtime.getTheme(unistyles.runtime.theme))
    const [breakpoint, setBreakpoint] = useState(unistyles.runtime.currentBreakpoint)
    const [screenSize, setScreenSize] = useState({
        width: 0,
        height: 0
    })

    useEffect(() => {
        const subscription = unistylesEvents.addListener(
            'onChange',
            (event: UnistylesEvents) => {
                switch (event.type) {
                    case CxxUnistylesEventTypes.Theme: {
                        const themeEvent = event as CxxUnistylesThemeEvent

                        setTheme(unistyles.runtime.getTheme(themeEvent.payload.currentTheme))

                        return
                    }
                    case CxxUnistylesEventTypes.Size: {
                        const sizeEvent = event as CxxUnistylesSizeEvent

                        setScreenSize({
                            width: sizeEvent.payload.width,
                            height: sizeEvent.payload.height
                        })
                        setBreakpoint(unistyles.runtime.currentBreakpoint)

                        return
                    }
                    default:
                        return
                }
            }
        )

        return subscription.remove
    }, [])

    return {
        theme,
        breakpoint,
        screenSize
    }
}
