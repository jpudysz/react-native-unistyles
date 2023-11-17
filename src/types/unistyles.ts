import { CxxUnistylesEventTypes, ScreenOrientation } from '../common'
import type { UnistylesThemes, UnistylesBreakpoints } from '../global'
import type { ScreenSize } from './core'
import type { Optional } from './common'

export type ColorSchemeName = Optional<'light' | 'dark'>

export type UnistylesConfig = {
    adaptiveThemes?: boolean
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
    addPlugin(pluginName: string): void,
    removePlugin(pluginName: string): void
}

export type UnistylesThemeEvent = {
    type: CxxUnistylesEventTypes.Theme,
    payload: {
        themeName: keyof UnistylesThemes
    }
}

export type UnistylesMobileLayoutEvent = {
    type: CxxUnistylesEventTypes.Layout,
    payload: {
        screen: ScreenSize,
        breakpoint: keyof UnistylesBreakpoints,
        orientation: ScreenOrientation
    }
}

export type UnistylesPluginEvent = {
    type: CxxUnistylesEventTypes.Plugin
}

export type UnistylesEvents = UnistylesThemeEvent | UnistylesMobileLayoutEvent | UnistylesPluginEvent
