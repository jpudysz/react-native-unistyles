import { Platform } from 'react-native'

export const throwError = (message: string) => {
    throw new Error(`🦄 [react-native-unistyles]: ${message}`)
}

export const warn = (message: string) => {
    console.warn(`🦄 [react-native-unistyles]: ${message}`)
}

export const isMobile = Platform.OS === 'android' || Platform.OS === 'ios'
export const isWeb = Platform.OS === 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isServer = typeof window === 'undefined'

export const Orientation = {
    Landscape: 'landscape',
    Portrait: 'portrait'
} as const

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

// todo to string?
export enum ScreenOrientation {
    Portrait = 1,
    Landscape = 2
}
