import { Platform } from 'react-native'

export const warn = (message: string) => {
    console.warn(`🦄 [react-native-unistyles]: ${message}`)
}

export const isWeb = Platform.OS === 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isMobile = isIOS || isAndroid
export const isServer = typeof window === 'undefined'

export const ScreenOrientation = {
    Landscape: 'landscape',
    Portrait: 'portrait'
} as const

export enum IOSContentSizeCategory {
    ExtraExtraExtraLarge = 'xxxLarge',
    ExtraExtraLarge = 'xxLarge',
    ExtraLarge = 'xLarge',
    Large = 'Large',
    Medium = 'Medium',
    Small = 'Small',
    ExtraSmall = 'xSmall',
    Unspecified = 'unspecified'
}

export enum AndroidContentSizeCategory {
    Small = 'Small',
    Default = 'Default',
    Large = 'Large',
    ExtraLarge = 'ExtraLarge',
    Huge = 'Huge'
}

export enum UnistylesEventType {
    Theme = 'theme',
    Layout = 'layout',
    Plugin = 'plugin',
    DynamicTypeSize = 'dynamicTypeSize'
}

export enum UnistylesError {
    RuntimeUnavailable = 'Unistyles runtime is not available. Make sure you followed the installation instructions',
    ThemeNotFound = 'You are trying to get a theme that is not registered with UnistylesRegistry',
    ThemeNotRegistered = 'You are trying to set a theme that was not registered with UnistylesRegistry',
    ThemeNotSelected = 'Your themes are registered, but you didn\'t select the initial theme',
    ThemesCannotBeEmpty = 'You are trying to register empty themes object',
    BreakpointsCannotBeEmpty = 'You are trying to register empty breakpoints object',
    BreakpointsMustStartFromZero = 'You are trying to register breakpoints that don\'t start from 0',
    InvalidPluginName = 'Plugin name can\'t start from reserved prefix __unistyles',
    DuplicatePluginName = 'You are trying to register a plugin with a name that is already registered',
    CantRemoveInternalPlugin = 'You are trying to remove an internal unistyles plugin'
}
