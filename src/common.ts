import { Platform } from 'react-native'

export const warn = (message: string) => {
    console.warn(`🦄 [react-native-unistyles]: ${message}`)
}

export const isMobile = Platform.OS === 'android' || Platform.OS === 'ios'
export const isWeb = Platform.OS === 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isServer = typeof window === 'undefined'

export const ScreenOrientation = {
    Landscape: 'landscape',
    Portrait: 'portrait'
} as const

export enum UnistylesEventType {
    Theme = 'theme',
    Layout = 'layout',
    Plugin = 'plugin'
}

export enum UnistylesError {
    RuntimeUnavailable = 'Unistyles runtime is not available. Make sure you followed the installation instructions.',
    ThemeNotFound = 'You are trying to get a theme that is not registered.',
    ThemeNotRegistered = 'You are trying to set a theme that is not registered.',
    ThemesCannotBeEmpty = 'You are trying to register an empty themes object.',
    BreakpointsCannotBeEmpty = 'You are trying to register an empty breakpoints object.',
    BreakpointsMustStartFromZero = 'One breakpoint must start from 0.',
    InvalidPluginName = 'Plugin name can\'t start from reserved prefix. Use another name.',
    DuplicatePluginName = 'You are trying to register a plugin with a name that is already registered.',
    CantRemoveInternalPlugin = 'You are trying to remove an internal unistyles plugin.'
}
