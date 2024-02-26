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
        },
        statusBar: {
            width: unistyles.runtime.statusBar.width,
            height: unistyles.runtime.statusBar.height
        },
        navigationBar: {
            width: unistyles.runtime.navigationBar.width,
            height: unistyles.runtime.navigationBar.height
        },
        intents: {
            top: unistyles.runtime.insets.top,
            bottom: unistyles.runtime.insets.bottom,
            left: unistyles.runtime.insets.left,
            right: unistyles.runtime.insets.right
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
                            screenSize: layoutEvent.payload.screen,
                            statusBar: layoutEvent.payload.statusBar,
                            intents: layoutEvent.payload.intents,
                            navigationBar: layoutEvent.payload.navigationBar
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
