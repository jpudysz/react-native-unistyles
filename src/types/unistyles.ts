import { UnistylesEventType, ScreenOrientation } from '../common'
import type { UnistylesThemes, UnistylesBreakpoints } from '../global'
import type { ScreenSize } from './core'
import type { Optional } from './common'
import type { UnistylesPlugin } from './plugin'

export type ColorSchemeName = Optional<'light' | 'dark'>

export type UnistylesConfig = {
    adaptiveThemes?: boolean,
    experimentalPlugins?: Array<UnistylesPlugin>,
    initialTheme?: keyof UnistylesThemes
}

export type UnistylesBridge = {
    // getters
    screenWidth: number,
    screenHeight: number,
    enabledPlugins: Array<string>,
    hasAdaptiveThemes: boolean,
    themeName: keyof UnistylesThemes,
    breakpoint: keyof UnistylesBreakpoints,
    colorScheme: ColorSchemeName,
    sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>,

    // setters
    themes: Array<keyof UnistylesThemes>,
    useBreakpoints(breakpoints: UnistylesBreakpoints): void,
    useTheme(name: keyof UnistylesThemes): void,
    useAdaptiveThemes(enable: boolean): void,
    addPlugin(pluginName: string, notify: boolean): void,
    removePlugin(pluginName: string): void
}

export type UnistylesThemeEvent = {
    type: UnistylesEventType.Theme,
    payload: {
        themeName: keyof UnistylesThemes
    }
}

export type UnistylesMobileLayoutEvent = {
    type: UnistylesEventType.Layout,
    payload: {
        screen: ScreenSize,
        breakpoint: keyof UnistylesBreakpoints,
        orientation: typeof ScreenOrientation[keyof typeof ScreenOrientation]
    }
}

export type UnistylesPluginEvent = {
    type: UnistylesEventType.Plugin
}

export type UnistylesEvents = UnistylesThemeEvent | UnistylesMobileLayoutEvent | UnistylesPluginEvent
