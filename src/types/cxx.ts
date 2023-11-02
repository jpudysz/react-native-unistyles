import type { UnistylesThemes, UnistylesBreakpoints } from '../global'

export type Nullable<T> = T | null
export enum UnistylesColorScheme {
    System = 'system',
    Manual = 'manual'
}

export type UnistylesConfig = {
    colorScheme?: UnistylesColorScheme,
    featureFlags?: Array<string>
}

export type UnistylesBridge = {
    // getters
    screenWidth: number,
    screenHeight: number,
    theme: keyof UnistylesThemes
    breakpoint: keyof UnistylesBreakpoints,
    colorScheme: UnistylesColorScheme,
    sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>

    // setters
    useBreakpoints(breakpoints: UnistylesBreakpoints): void,
    useTheme(name: keyof UnistylesThemes): void,
    useColorScheme(scheme: UnistylesColorScheme): void,
    useFeatureFlags(flags: Array<string>): void
}

export enum CxxUnistylesEventTypes {
    Theme = 'theme',
    Size = 'size',
    Breakpoint = 'breakpoint'
}

export type CxxUnistylesThemeEvent = {
    type: CxxUnistylesEventTypes.Theme,
    payload: {
        currentTheme: keyof UnistylesThemes
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
        currentBreakpoint: keyof UnistylesBreakpoints
    }
}

export type UnistylesEvents = CxxUnistylesThemeEvent | CxxUnistylesSizeEvent | CxxUnistylesBreakpointEvent

export enum UnistylesError {
    RuntimeUnavailable = 'UNISTYLES_ERROR_RUNTIME_UNAVAILABLE',
    ThemeNotFound = 'UNISTYLES_ERROR_THEME_NOT_FOUND'
}
