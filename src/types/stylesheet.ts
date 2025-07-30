import type { CSSProperties } from 'react'
import type { BoxShadowValue, FilterFunction, ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { UnistylesBreakpoints } from '../global'
import type { UnistylesMiniRuntime } from '../specs'
import type { Pseudo } from '../web/convert/pseudo'
import type { ReactNativeStyleSheet } from './breakpoints'
import type { ShadowOffset, TransformStyles, UnistylesTheme } from './core'
import type { ExtractVariantNames } from './variants'

// these props are treated differently to nest breakpoints and media queries
type NestedKeys = 'shadowOffset' | 'transform' | 'textShadowOffset' | 'boxShadow' | 'filter'

export type UnistyleView = Omit<ViewStyle, NestedKeys>
export type UnistyleText = Omit<TextStyle, NestedKeys>
export type UnistyleImage = Omit<ImageStyle, NestedKeys>

type UnistyleNestedStyles = {
    shadowOffset?: ToDeepUnistyles<ShadowOffset>,
    textShadowOffset?: ToDeepUnistyles<ShadowOffset>,
    transform?: Array<ToDeepUnistyles<TransformStyles>>,
    boxShadow?: Array<ToDeepUnistyles<BoxShadowValue>> | string,
    filter?: Array<ToDeepUnistyles<FilterFunction>> | string
}

type VariantsObject = {
    [variantName: string]: {
        [variant: string]: Omit<UnistylesValues, 'variants' | 'compoundVariants'>
    }
}

type CustomClassName = {
    _classNames?: string | Array<string>
}

type CompoundVariant = {
    styles: Omit<UnistylesValues, 'variants' | 'compoundVariants'>
}

type VariantsAndCompoundVariants = {
    variants?: VariantsObject,
    compoundVariants?: Array<CompoundVariant>
}

export type UnistylesValue<T> = T | {
    [key in BreakpointsOrMediaQueries]?: T
}

export type ToDeepUnistyles<T> = {
    [K in keyof T]?: UnistylesValue<T[K]>
}

type AllAvailableStyles = UnistyleView & UnistyleText & UnistyleImage & UnistyleNestedStyles

export type AllAvailableKeys = keyof (UnistyleView & UnistyleText & UnistyleImage)
export type BreakpointsOrMediaQueries = keyof UnistylesBreakpoints | symbol

type FlatUnistylesValues = {
    [propName in AllAvailableKeys]?: AllAvailableStyles[propName] | {
        [key in BreakpointsOrMediaQueries]?: AllAvailableStyles[propName]
    }
}

export type StyleSheetValues = FlatUnistylesValues & {
    [propName in NestedKeys]?: UnistyleNestedStyles[propName]
}

export type UnistylesValues = StyleSheetValues & {
} & VariantsAndCompoundVariants & {
    _web?: ToDeepUnistyles<CSSProperties> & CustomClassName & {
        [propName in Pseudo]?: ToDeepUnistyles<CSSProperties>
    }
}

export type StyleSheet = {
    [styleName: string]: UnistylesValues | ((...args: any) => UnistylesValues)
}

export type StyleSheetWithSuperPowers<S extends StyleSheet> =
    | ((theme: UnistylesTheme, miniRuntime: UnistylesMiniRuntime) => S)
    | S

type UseVariantsFn<T> = {
    useVariants: (variants: ExtractVariantNames<T>) => void
}

const create = <S extends StyleSheet>(stylesheet: StyleSheetWithSuperPowers<S>): (ReactNativeStyleSheet<S> & UseVariantsFn<typeof stylesheet>) => stylesheet as (ReactNativeStyleSheet<S> & UseVariantsFn<typeof stylesheet>)

export type CreateUnistylesStyleSheet = typeof create
