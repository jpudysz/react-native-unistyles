import type { ColorValue } from 'react-native'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'

export enum ColorScheme {
    Light = 'light',
    Dark = 'dark',
    Unspecified = 'unspecified'
}

export enum Orientation {
    Portrait = 'portrait',
    Landscape = 'landscape'
}

export interface Dimensions {
    readonly width: number
    readonly height: number
}

export interface Insets {
    readonly top: number
    readonly bottom: number
    readonly left: number
    readonly right: number
    readonly ime: number
}

export enum StatusBarStyle {
    Default = 'default',
    Light = 'light',
    Dark = 'dark'
}

export type AppThemeName = keyof UnistylesThemes
export type AppBreakpoint = keyof UnistylesBreakpoints
export type AppTheme = UnistylesThemes[AppThemeName]

export type Color = ColorValue | number
