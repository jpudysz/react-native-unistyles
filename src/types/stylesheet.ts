import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { ShadowOffset, TransformStyles, UnistylesTheme } from './core'
import type { UnistylesBreakpoints } from '../global'
import type { MiniRuntime } from '../specs'
import type { ReactNativeStyleSheet } from './breakpoints'
import type { Pseudo } from '../../web/pseudo'

// these props are treated differently to nest breakpoints and media queries
type NestedKeys = 'shadowOffset' | 'transform' | 'textShadowOffset'

export type UnistyleView = Omit<ViewStyle, NestedKeys>
export type UnistyleText = Omit<TextStyle, NestedKeys>
export type UnistyleImage = Omit<ImageStyle, NestedKeys>

type UnistyleNestedStyles = {
    shadowOffset?: ToDeepUnistyles<ShadowOffset>,
    textShadowOffset?: ToDeepUnistyles<ShadowOffset>,
    transform?: Array<ToDeepUnistyles<TransformStyles>>
}

type Variants = {
    variants?: {
        [variantName: string]: {
            [variant: string]: Omit<UnistylesValues, 'variants'>
        }
    }
}

export type ToDeepUnistyles<T> = {
    [K in keyof T]?: T[K] | {
        [key in BreakpointsOrMediaQueries]?: T[K]
    }
}

type AllAvailableStyles = UnistyleView & UnistyleText & UnistyleImage & UnistyleNestedStyles

export type AllAvailableKeys = keyof (UnistyleView & UnistyleText & UnistyleImage)
export type BreakpointsOrMediaQueries = keyof UnistylesBreakpoints | symbol

type FlatUnistylesValues = {
    [propName in AllAvailableKeys]?: AllAvailableStyles[propName] | {
        [key in BreakpointsOrMediaQueries]?: AllAvailableStyles[propName]
    }
}

export type UnistylesValues = FlatUnistylesValues & Variants & {
    [propName in NestedKeys]?: UnistyleNestedStyles[propName]
} & {
    [propName in Pseudo]?: FlatUnistylesValues
}

export type StyleSheet = {
    [styleName: string]: UnistylesValues | ((...args: any) => UnistylesValues)
}

export type StyleSheetWithSuperPowers<S extends StyleSheet> =
    | ((theme: UnistylesTheme, miniRuntime: MiniRuntime) => S)
    | S

export type CreateUnistylesStyleSheet = <S extends StyleSheet>(stylesheet: StyleSheetWithSuperPowers<S>) => ReactNativeStyleSheet<S>
