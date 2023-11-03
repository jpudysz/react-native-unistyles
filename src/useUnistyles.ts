import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import type {
    CxxUnistylesBreakpointEvent,
    CxxUnistylesSizeEvent,
    CxxUnistylesThemeEvent,
    UnistylesEvents
} from './types'
import { CxxUnistylesEventTypes } from './types'
import { unistyles } from './Unistyles'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [theme, setTheme] = useState(unistyles.runtime.getTheme(unistyles.runtime.themeName))
    const [breakpoint, setBreakpoint] = useState(unistyles.runtime.breakpoint)
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

                        setTheme(unistyles.runtime.getTheme(themeEvent.payload.themeName))

                        return
                    }
                    // this event is not available on mobile
                    case CxxUnistylesEventTypes.Size: {
                        const sizeEvent = event as CxxUnistylesSizeEvent

                        setScreenSize({
                            width: sizeEvent.payload.width,
                            height: sizeEvent.payload.height
                        })

                        return
                    }
                    case CxxUnistylesEventTypes.Breakpoint: {
                        const breakpointEvent = event as CxxUnistylesBreakpointEvent

                        setBreakpoint(breakpointEvent.payload.breakpoint)

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
