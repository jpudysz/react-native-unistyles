import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import type { CxxUnistylesSizeEvent, CxxUnistylesThemeEvent, UnistylesEvents } from './CxxUnistyles'
import { CxxUnistylesEventTypes, UnistylesRuntime } from './CxxUnistyles'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [, setTheme] = useState(UnistylesRuntime.getCurrentTheme())
    const [, setBreakpoint] = useState(UnistylesRuntime.getCurrentBreakpoint())
    const [, screenSize] = useState({
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

                        setTheme(themeEvent.payload.currentTheme)

                        return
                    }
                    case CxxUnistylesEventTypes.Size: {
                        const sizeEvent = event as CxxUnistylesSizeEvent

                        screenSize({
                            width: sizeEvent.payload.width,
                            height: sizeEvent.payload.height
                        })
                        setBreakpoint(UnistylesRuntime.getCurrentBreakpoint())

                        return
                    }
                    default:
                        return
                }
            }
        )

        return subscription.remove
    }, [])
}
