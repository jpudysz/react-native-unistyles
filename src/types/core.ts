import type {
    MatrixTransform,
    PerpectiveTransform,
    RotateTransform,
    RotateXTransform,
    RotateYTransform,
    RotateZTransform,
    ScaleTransform,
    ScaleXTransform,
    ScaleYTransform,
    SkewXTransform,
    SkewYTransform,
    TranslateXTransform,
    TranslateYTransform
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { MediaQueries } from './mediaQueries'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'

type ShadowOffset = {
    width: number,
    height: number
}

type TransformStyles =
    & PerpectiveTransform
    & RotateTransform
    & RotateXTransform
    & RotateYTransform
    & RotateZTransform
    & ScaleTransform
    & ScaleXTransform
    & ScaleYTransform
    & TranslateXTransform
    & TranslateYTransform
    & SkewXTransform
    & SkewYTransform
    & MatrixTransform

type UnistyleNested = {
    shadowOffset?: DeepUniStyle<ShadowOffset>,
    textShadowOffset?: DeepUniStyle<ShadowOffset>,
    transform?: Array<DeepUniStyle<TransformStyles>>
}

type UniStyle<V> = {
    [innerKey in keyof UnistylesBreakpoints]: V
} | {
    [innerKey in MediaQueries]: V
}

type DeepUniStyle<T> = {
    [K in keyof T]?: UniStyle<T[K]> | T[K]
}

// these props are treated differently to nest breakpoints and media queries
type NestedTypes = 'shadowOffset' | 'transform' | 'textShadowOffset'

type UnistyleView = DeepUniStyle<Omit<ViewStyle, NestedTypes>>
type UnistyleText = DeepUniStyle<Omit<TextStyle, NestedTypes>>
type UnistyleImage = DeepUniStyle<Omit<ImageStyle, NestedTypes>>

export type StaticStyles =
    | UnistyleView
    | UnistyleText
    | UnistyleImage
    & UnistyleNested

export type CustomNamedStyles<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => StaticStyles
        ? (...args: A) => StaticStyles
        : StaticStyles
}

export type NestedKeys = Array<[keyof UnistylesBreakpoints | MediaQueries, string | number | undefined]>
export type UnistylesTheme = UnistylesThemes[keyof UnistylesThemes]
