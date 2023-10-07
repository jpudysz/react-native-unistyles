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

export type Breakpoints = Record<string, number>

export type SortedBreakpointEntries<B extends Breakpoints> = [[keyof B & string, number]]

export type ScreenSize = {
    width: number,
    height: number
}

export type CreateStylesFactory<ST, Theme> = (theme: Theme) => ST

type StyleProperty<T, B extends Breakpoints> = {
    [K in keyof T]: {
        [innerKey in keyof B]?: T[K]
    } | {
        [innerKey in string]?: T[K]
    } | T[K]
}

type ShadowOffsetProps<B extends Breakpoints> = {
    shadowOffset: {
        width: number | {
            [innerKey in keyof B]?: number
        },
        height: number | {
            [innerKey in keyof B]?: number
        }
    }
}

type TextShadowOffsetProps<B extends Breakpoints> = {
    textShadowOffset: {
        width: number | {
            [innerKey in keyof B]?: number
        },
        height: number | {
            [innerKey in keyof B]?: number
        }
    }
}

type TransformStyles<B extends Breakpoints> =
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

type TransformProps<B extends Breakpoints> = {
    transform: Array<TransformStyles<B>>
}

type UnistyleView = Omit<Omit<Omit<ViewStyle, 'shadowOffset'>, 'transform'>, 'textShadowOffset'>
type UnistyleText = Omit<Omit<Omit<TextStyle, 'shadowOffset'>, 'transform'>, 'textShadowOffset'>
type UnistyleImage = Omit<Omit<Omit<ImageStyle, 'shadowOffset'>, 'transform'>, 'textShadowOffset'>

export type StaticStyles<B extends Breakpoints> =
    | (UnistyleView | StyleProperty<UnistyleView, B>)
    | (UnistyleText | StyleProperty<UnistyleText, B>)
    | (UnistyleImage | StyleProperty<UnistyleImage, B>)
    & TransformProps<B> & ShadowOffsetProps<B> & TextShadowOffsetProps<B>

export type CustomNamedStyles<T, B extends Breakpoints> = {
    [K in keyof T]: T[K] extends (...args: infer A) => unknown
        ? (...args: A) => StaticStyles<B>
        : StaticStyles<B>
}

type WithEmptyObject<V> = keyof V extends never ? {} : V

export type ExtractBreakpoints<T, B extends Breakpoints> = T extends Partial<Record<keyof B & string, infer V>>
    ? WithEmptyObject<V>
    : T extends (...args: infer A) => infer R
        ? (...args: A) => ExtractBreakpoints<R, B>
        : {
            [K in keyof T]: T[K] extends (...args: infer A) => infer R
                ? (...args: A) => ExtractBreakpoints<R, B>
                : T[K] extends object
                    ? ExtractBreakpoints<T[K], B>
                    : T[K]
        }

export type RemoveKeysWithPrefix<T, B extends Breakpoints> = T extends (...args: Array<any>) => infer R
    ? (...args: Parameters<T>) => RemoveKeysWithPrefix<R, B>
    : T extends object
        ? T extends Record<string, infer _V>
            ? { [K in keyof T as K extends `:w${string}` | `:h${string}` ? keyof B & string : K]: RemoveKeysWithPrefix<T[K], B> }
            : { [K in keyof T]: RemoveKeysWithPrefix<T[K], B> }
        : T
