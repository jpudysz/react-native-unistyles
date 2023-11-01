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
import type { UnistylesBreakpoints } from '../global'

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

type UnistyleNested<B> = {
    shadowOffset?: DeepUniStyle<ShadowOffset, B>,
    textShadowOffset?: DeepUniStyle<ShadowOffset, B>,
    transform?: Array<DeepUniStyle<TransformStyles, B>>
}

type UniStyle<V, B> = {
    [innerKey in keyof B]?: V
} | {
    [innerKey in MediaQueries]?: V
} | V

type DeepUniStyle<T, B> = {
    [K in keyof T]?: UniStyle<T[K], B>
}

// these props are treated differently to nest breakpoints and media queries
type NestedTypes = 'shadowOffset' | 'transform' | 'textShadowOffset'

type UnistyleView<B> = DeepUniStyle<Omit<ViewStyle, NestedTypes>, B>
type UnistyleText<B> = DeepUniStyle<Omit<TextStyle, NestedTypes>, B>
type UnistyleImage<B> = DeepUniStyle<Omit<ImageStyle, NestedTypes>, B>

export type StaticStyles<B> =
    | UnistyleView<B>
    | UnistyleText<B>
    | UnistyleImage<B>
    & UnistyleNested<B>

export type CustomNamedStyles<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => StaticStyles<UnistylesBreakpoints>
        ? (...args: A) => StaticStyles<UnistylesBreakpoints>
        : StaticStyles<UnistylesBreakpoints>
}
