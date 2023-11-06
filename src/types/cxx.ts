import type { UnistylesThemes, UnistylesBreakpoints } from '../global'

export type Nullable<T> = T | null
export type ColorSchemeName = 'light' | 'dark' | undefined

export type UnistylesConfig = {
    adaptiveThemes?: boolean
}

export enum ScreenOrientation {
    Portrait = 1,
    Landscape = 2
}

export type UnistylesBridge = {
    // getters
    screenWidth: number,
    screenHeight: number,
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

    // other
    unregister(): void
}

export enum CxxUnistylesEventTypes {
    Theme = 'theme',
    Size = 'size',
    Breakpoint = 'breakpoint'
}

export type CxxUnistylesThemeEvent = {
    type: CxxUnistylesEventTypes.Theme,
    payload: {
        themeName: keyof UnistylesThemes
    }
}

export type CxxUnistylesSizeEvent = {
    type: CxxUnistylesEventTypes.Size,
    payload: {
        width: number,
        height: number
    }
}

export type CxxUnistylesBreakpointEvent = {
    type: CxxUnistylesEventTypes.Breakpoint,
    payload: {
        breakpoint: keyof UnistylesBreakpoints
    }
}

export type UnistylesEvents = CxxUnistylesThemeEvent | CxxUnistylesSizeEvent | CxxUnistylesBreakpointEvent

export enum UnistylesError {
    RuntimeUnavailable = 'UNISTYLES_ERROR_RUNTIME_UNAVAILABLE',
    ThemeNotFound = 'UNISTYLES_ERROR_THEME_NOT_FOUND',
    ThemeNotRegistered = 'UNISTYLES_ERROR_THEME_NOT_REGISTERED',
    ThemesCannotBeEmpty = 'UNISTYLES_ERROR_THEMES_CANNOT_BE_EMPTY',
    BreakpointsCannotBeEmpty = 'UNISTYLES_ERROR_BREAKPOINTS_CANNOT_BE_EMPTY',
    BreakpointsMustStartFromZero = 'UNISTYLES_ERROR_BREAKPOINTS_MUST_START_FROM_ZERO',
}
