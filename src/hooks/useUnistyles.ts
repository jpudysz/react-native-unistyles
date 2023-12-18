import { NativeEventEmitter, NativeModules } from 'react-native'
import { useEffect, useState } from 'react'
import { unistyles } from '../core'
import { UnistylesEventType } from '../common'
import type { UnistylesDynamicTypeSizeEvent, UnistylesEvents, UnistylesMobileLayoutEvent, UnistylesThemeEvent } from '../types'

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)

export const useUnistyles = () => {
    const [plugins, setPlugins] = useState(unistyles.runtime.enabledPlugins)
    const [theme, setTheme] = useState(unistyles.registry.getTheme(unistyles.runtime.themeName))
    const [contentSizeCategory, setContentSizeCategory] = useState(unistyles.runtime.contentSizeCategory)
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
            '__unistylesOnChange',
            (event: UnistylesEvents) => {
                switch (event.type) {
                    case UnistylesEventType.Theme: {
                        const themeEvent = event as UnistylesThemeEvent

                        return setTheme(unistyles.registry.getTheme(themeEvent.payload.themeName))
                    }
                    case UnistylesEventType.Layout: {
                        const layoutEvent = event as UnistylesMobileLayoutEvent

                        return setLayout({
                            breakpoint: layoutEvent.payload.breakpoint,
                            orientation: layoutEvent.payload.orientation,
                            screenSize: layoutEvent.payload.screen
                        })
                    }
                    case UnistylesEventType.Plugin: {
                        return setPlugins(unistyles.runtime.enabledPlugins)
                    }
                    case UnistylesEventType.DynamicTypeSize: {
                        const dynamicTypeSizeEvent = event as UnistylesDynamicTypeSizeEvent

                        return setContentSizeCategory(dynamicTypeSizeEvent.payload.contentSizeCategory)
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
        layout,
        contentSizeCategory
    }
}
