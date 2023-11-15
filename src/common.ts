export enum CxxUnistylesEventTypes {
    Theme = 'theme',
    Layout = 'layout'
}

export enum UnistylesError {
    RuntimeUnavailable = 'UNISTYLES_ERROR_RUNTIME_UNAVAILABLE',
    ThemeNotFound = 'UNISTYLES_ERROR_THEME_NOT_FOUND',
    ThemeNotRegistered = 'UNISTYLES_ERROR_THEME_NOT_REGISTERED',
    ThemesCannotBeEmpty = 'UNISTYLES_ERROR_THEMES_CANNOT_BE_EMPTY',
    BreakpointsCannotBeEmpty = 'UNISTYLES_ERROR_BREAKPOINTS_CANNOT_BE_EMPTY',
    BreakpointsMustStartFromZero = 'UNISTYLES_ERROR_BREAKPOINTS_MUST_START_FROM_ZERO',
}

export enum ScreenOrientation {
    Portrait = 1,
    Landscape = 2
}
