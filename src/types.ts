import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
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

export type ScreenSize = {
    width: number,
    height: number
}

export type CreateStylesFactory<ST, Theme> = (theme: Theme) => ST

type StyleProperty<T, B extends Record<string, number>> = {
    [K in keyof T]: {
        [innerKey in keyof B]?: T[K]
    } | {
        [innerKey in string]?: T[K]
    } | T[K]
}

type ShadowOffsetProps<B extends Record<string, number>> = {
    shadowOffset: {
        width: number | {
            [innerKey in keyof B]?: number
        },
        height: number | {
            [innerKey in keyof B]?: number
        }
    }
}

type TransformStyles<B extends Record<string, number>> =
    PerpectiveTransform | StyleProperty<PerpectiveTransform, B>
    | RotateTransform | StyleProperty<RotateTransform, B>
    | RotateXTransform | StyleProperty<RotateXTransform, B>
    | RotateYTransform | StyleProperty<RotateYTransform, B>
    | RotateZTransform | StyleProperty<RotateZTransform, B>
    | ScaleTransform | StyleProperty<ScaleTransform, B>
    | ScaleXTransform | StyleProperty<ScaleXTransform, B>
    | ScaleYTransform | StyleProperty<ScaleYTransform, B>
    | TranslateXTransform | StyleProperty<TranslateXTransform, B>
    | TranslateYTransform | StyleProperty<TranslateYTransform, B>
    | SkewXTransform | StyleProperty<SkewXTransform, B>
    | SkewYTransform | StyleProperty<SkewYTransform, B>
    | MatrixTransform | StyleProperty<MatrixTransform, B>

type TransformProps<B extends Record<string, number>> = {
    transform: Array<TransformStyles<B>>
}

type UnistyleView = Omit<Omit<ViewStyle, 'shadowOffset'>, 'transform'>
type UnistyleText = Omit<Omit<TextStyle, 'shadowOffset'>, 'transform'>
type UnistyleImage = Omit<Omit<ImageStyle, 'shadowOffset'>, 'transform'>

export type StaticStyles<B extends Record<string, number>> =
    | (UnistyleView | StyleProperty<UnistyleView, B>)
    | (UnistyleText | StyleProperty<UnistyleText, B>)
    | (UnistyleImage | StyleProperty<UnistyleImage, B>)
    & TransformProps<B> & ShadowOffsetProps<B>

export type CustomNamedStyles<T, B extends Record<string, number>> = {
    [K in keyof T]: T[K] extends (...args: infer A) => unknown
        ? (...args: A) => StaticStyles<B>
        : StaticStyles<B>
}
export type ExtractBreakpoints<T, B extends Record<string, number>> = T extends Partial<Record<keyof B & string, infer V>>
    ? V
    : T extends (...args: infer A) => infer R
        ? (...args: A) => ExtractBreakpoints<R, B>
        : {
            [K in keyof T]: T[K] extends (...args: infer A) => infer R
                ? (...args: A) => ExtractBreakpoints<R, B>
                : T[K] extends object
                    ? ExtractBreakpoints<T[K], B>
                    : T[K]
        }

export type RemoveKeysWithPrefix<T, B extends Record<string, number>> = T extends (...args: Array<any>) => infer R
    ? (...args: Parameters<T>) => RemoveKeysWithPrefix<R, B>
    : T extends object
        ? T extends Record<string, infer _V>
            ? { [K in keyof T as K extends `:w${string}` | `:h${string}` ? keyof B & string : K]: RemoveKeysWithPrefix<T[K], B> }
            : { [K in keyof T]: RemoveKeysWithPrefix<T[K], B> }
        : T
