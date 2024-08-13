import { UnistylesEventType, ScreenOrientation, IOSContentSizeCategory, AndroidContentSizeCategory } from '../common'
import type { UnistylesThemes, UnistylesBreakpoints } from '../global'
import type { ScreenSize } from './core'
import type { UnistylesPlugin } from './plugin'

export type ColorSchemeName = 'light' | 'dark' | 'unspecified'

export type ScreenInsets = {
    top: number,
    right: number,
    bottom: number,
    left: number
}

export type ScreenDimensions = {
    height: number,
    width: number
}

export interface StatusBar extends ScreenDimensions {
    setColor(color?: string, alpha?: number): void,
    setHidden(hidden: boolean): void
}

export interface NavigationBar extends ScreenDimensions {
    setColor(color?: string, alpha?: number): void,
    setHidden(hidden: boolean): void
}

export type UnistylesConfig = {
    adaptiveThemes?: boolean,
    initialTheme?: keyof UnistylesThemes,
    plugins?: Array<UnistylesPlugin>,
    experimentalCSSMediaQueries?: boolean,
    windowResizeDebounceTimeMs?: number
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
    contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory,
    sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>,
    insets: ScreenInsets,
    statusBar: StatusBar,
    navigationBar: NavigationBar,
    pixelRatio: number,
    fontScale: number,
    rtl: boolean

    // setters
    themes: Array<keyof UnistylesThemes>,
    useBreakpoints(breakpoints: UnistylesBreakpoints): void,
    useTheme(name: keyof UnistylesThemes): void,
    updateTheme(name: keyof UnistylesThemes): void,
    useAdaptiveThemes(enable: boolean): void,
    addPlugin(pluginName: string, notify: boolean): void,
    removePlugin(pluginName: string): void,
    setRootViewBackgroundColor(color?: string, alpha?: number): void,
    setImmersiveMode(isEnabled: boolean): void

    // web only
    setWindowResizeDebounceTimeMs(timeMs: number): void
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
        statusBar: ScreenDimensions,
        navigationBar: ScreenDimensions,
        insets: ScreenInsets,
        breakpoint: keyof UnistylesBreakpoints,
        orientation: typeof ScreenOrientation[keyof typeof ScreenOrientation]
    }
}

export type UnistylesPluginEvent = {
    type: UnistylesEventType.Plugin
}

export type UnistylesEvents = UnistylesThemeEvent | UnistylesMobileLayoutEvent | UnistylesPluginEvent
