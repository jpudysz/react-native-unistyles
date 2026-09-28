import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'

import type { UnistylesBreakpoints, UnistylesThemes } from '../global'

export type ShadowOffset = {
    width: number
    height: number
}

type TransformEntry = Exclude<NonNullable<ViewStyle['transform']>, string>[number]
type TransformKeys<T> = T extends unknown ? keyof T : never
type TransformValue<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? T[K] : never) : never

export type TransformStyles = {
    [K in TransformKeys<TransformEntry>]: Exclude<TransformValue<TransformEntry, K>, void | undefined>
}

export type ScreenSize = {
    width: number
    height: number
}

export type RNStyle = ViewStyle & TextStyle & ImageStyle
export type RNValue = ViewStyle[keyof ViewStyle] | TextStyle[keyof TextStyle] | ImageStyle[keyof ImageStyle]
export type NestedStyle = Record<keyof UnistylesBreakpoints | symbol, RNValue>
export type NestedStylePairs = Array<[keyof UnistylesBreakpoints | symbol, RNValue]>
export type UnistylesTheme = UnistylesThemes[keyof UnistylesThemes]
