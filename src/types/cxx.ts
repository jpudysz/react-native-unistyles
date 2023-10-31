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
    // accessors
    theme: keyof UnistylesThemes
    breakpoint: keyof UnistylesBreakpoints,
    colorScheme: UnistylesColorScheme,
    sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>

    // registration
    registerBreakpoints(breakpoints: UnistylesBreakpoints): void,
    registerThemes(forNames: Array<string>): void,

    // actions
    useTheme(name: keyof UnistylesThemes): void,
    useColorScheme(scheme: UnistylesColorScheme): void,
    useFeatureFlags(flags: Array<string>): void
}

export enum CxxUnistylesEventTypes {
    Theme = 'theme',
    Size = 'size'
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

export type UnistylesEvents = CxxUnistylesThemeEvent | CxxUnistylesSizeEvent

export enum UnistylesError {
    RuntimeUnavailable = 'UNISTYLES_ERROR_RUNTIME_UNAVAILABLE',
    RegistryClosed = 'UNISTYLES_ERROR_REGISTRY_CLOSED',
    ThemeNotFound = 'UNISTYLES_ERROR_THEME_NOT_FOUND',
    ThemeNotSet = 'UNISTYLES_ERROR_THEME_NOT_SET',
}
