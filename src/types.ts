import type { ImageStyle, TextStyle, TransformsStyle, ViewStyle } from 'react-native'
import type { CSSProperties } from 'react'

export type ScreenSize = {
    width: number,
    height: number
}

export type CreateStylesFactory<T, Theme> = (theme: Theme) => T

type StyleProperty<T, B extends Record<string, number>> = {
    [key in keyof T]?: {
        [innerKey in keyof B]?: T[key]
    } | {
        [innerKey in `:w${string}` | `:h${string}`]?: T[key]
    } | T[key]
}

export type CustomNamedStyles<T, B extends Record<string, number>> = {
    [P in keyof T]:
    | ViewStyle
    | TextStyle
    | ImageStyle
    | TransformsStyle
    | CSSProperties
    | StyleProperty<ViewStyle, B>
    | StyleProperty<ImageStyle, B>
    | StyleProperty<TextStyle, B>
    | (
        (...args: Array<never>) => ViewStyle | TextStyle | ImageStyle | TransformsStyle | CSSProperties | StyleProperty<ViewStyle, B> | StyleProperty<ImageStyle, B> | StyleProperty<TextStyle, B>
    )
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
