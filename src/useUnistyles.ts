import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import type {
    UnistylesThemeEvent,
    UnistylesMobileLayoutEvent,
    UnistylesEvents,
    ScreenSize,
    UnistylesTheme
} from './types'
import { CxxUnistylesEventTypes, ScreenOrientation } from './types'
import { unistyles } from './Unistyles'
import type { UnistylesBreakpoints } from './global'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [orientation, setOrientation] = useState<ScreenOrientation>(unistyles.runtime.orientation)
    const [theme, setTheme] = useState<UnistylesTheme>(unistyles.runtime.getTheme(unistyles.runtime.themeName))
    const [breakpoint, setBreakpoint] = useState<keyof UnistylesBreakpoints>(unistyles.runtime.breakpoint)
    const [screenSize, setScreenSize] = useState<ScreenSize>({
        width: unistyles.runtime.screen.width,
        height: unistyles.runtime.screen.height
    })

    useEffect(() => {
        const subscription = unistylesEvents.addListener(
            'onChange',
            (event: UnistylesEvents) => {
                switch (event.type) {
                    case CxxUnistylesEventTypes.Theme: {
                        const themeEvent = event as UnistylesThemeEvent

                        setTheme(unistyles.runtime.getTheme(themeEvent.payload.themeName))

                        return
                    }
                    case CxxUnistylesEventTypes.Layout: {
                        const layoutEvent = event as UnistylesMobileLayoutEvent

                        setBreakpoint(layoutEvent.payload.breakpoint)
                        setOrientation(layoutEvent.payload.orientation)
                        setScreenSize(layoutEvent.payload.screen)

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
        orientation,
        breakpoint,
        screenSize
    }
}
