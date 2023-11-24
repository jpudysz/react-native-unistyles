import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { ShadowOffset, TransformStyles, UnistylesTheme } from './core'
import type { UnistylesBreakpoints } from '../global'
import type { MediaQuery } from './mq'

// these props are treated differently to nest breakpoints and media queries
type NestedTypes = 'shadowOffset' | 'transform' | 'textShadowOffset'

// so let's remove their original types
type UnistyleView = Omit<ViewStyle, NestedTypes>
type UnistyleText = Omit<TextStyle, NestedTypes>
type UnistyleImage = Omit<ImageStyle, NestedTypes>

// and replace them with our own
type UnistyleNestedStyles = {
    shadowOffset?: ToDeepUnistyles<ShadowOffset>,
    textShadowOffset?: ToDeepUnistyles<ShadowOffset>,
    transform?: Array<ToDeepUnistyles<TransformStyles>>
}

type Variants = {
    variants?: {
        [variantName: string]: {
            [variant: string]: {
                [propName in AllAvailableKeys]?: AllAvailableStyles[propName] | {
                    [key in BreakpointsOrMediaQueries]?: AllAvailableStyles[propName]
                } & {
                    [propName in NestedTypes]?: UnistyleNestedStyles[propName]
                }
            }
        }
    }
}

// but still allow the old types
type ToDeepUnistyles<T> = {
    [K in keyof T]?: T[K] | {
        [key in BreakpointsOrMediaQueries]?: T[K]
    }
}

type AllAvailableStyles = UnistyleView & UnistyleText & UnistyleImage & UnistyleNestedStyles

export type AllAvailableKeys = keyof (UnistyleView & UnistyleText & UnistyleImage)
export type BreakpointsOrMediaQueries = keyof UnistylesBreakpoints | MediaQuery

export type UnistylesValues = {
    [propName in AllAvailableKeys]?: AllAvailableStyles[propName] | {
        [key in BreakpointsOrMediaQueries]?: AllAvailableStyles[propName]
    }
} & Variants & {
    [propName in NestedTypes]?: UnistyleNestedStyles[propName]
}

export type StyleSheet = {
    [styleName: string]: UnistylesValues | ((...args: any) => UnistylesValues)
}

export type StyleSheetWithSuperPowers = ((theme: UnistylesTheme) => StyleSheet) | StyleSheet