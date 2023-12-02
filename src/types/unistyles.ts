import { UnistylesEventType, ScreenOrientation } from '../common'
import type { UnistylesThemes, UnistylesBreakpoints } from '../global'
import type { ScreenSize } from './core'
import type { UnistylesPlugin } from './plugin'

export type ColorSchemeName = 'light' | 'dark' | 'unspecified'

export type UnistylesConfig = {
    adaptiveThemes?: boolean,
    initialTheme?: keyof UnistylesThemes,
    plugins?: Array<UnistylesPlugin>,
    experimentalCSSMediaQueries?: boolean
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
