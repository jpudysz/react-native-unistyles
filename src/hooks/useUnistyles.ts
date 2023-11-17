import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import { unistyles } from '../core'
import { CxxUnistylesEventTypes } from '../common'
import type { UnistylesEvents, UnistylesMobileLayoutEvent, UnistylesThemeEvent } from '../types'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [plugins, setPlugins] = useState(unistyles.runtime.enabledPlugins)
    const [theme, setTheme] = useState(unistyles.runtime.getTheme(unistyles.runtime.themeName))
    const [layout, setLayout] = useState({
        breakpoint: unistyles.runtime.breakpoint,
        orientation: unistyles.runtime.orientation,
        screenSize: {
            width: unistyles.runtime.screen.width,
            height: unistyles.runtime.screen.height
        }
    })

    useEffect(() => {
        const subscription = unistylesEvents.addListener(
            'onChange',
            (event: UnistylesEvents) => {
                switch (event.type) {
                    case CxxUnistylesEventTypes.Theme: {
                        const themeEvent = event as UnistylesThemeEvent

                        return setTheme(unistyles.runtime.getTheme(themeEvent.payload.themeName))
                    }
                    case CxxUnistylesEventTypes.Layout: {
                        const layoutEvent = event as UnistylesMobileLayoutEvent

                        return setLayout({
                            breakpoint: layoutEvent.payload.breakpoint,
                            orientation: layoutEvent.payload.orientation,
                            screenSize: {
                                width: layoutEvent.payload.screen.width,
                                height: layoutEvent.payload.screen.height
                            }
                        })
                    }
                    case CxxUnistylesEventTypes.Plugin: {
                        return setPlugins(unistyles.runtime.enabledPlugins)
                    }
                    default:
                        return
                }
            }
        )

        return subscription.remove
    }, [])

    return {
        plugins,
        theme,
        layout
    }
}
