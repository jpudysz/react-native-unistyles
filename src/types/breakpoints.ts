import type { ColorValue, OpaqueColorValue } from 'react-native'
import type { UnistylesTheme } from '../types'
import type { BreakpointsOrMediaQueries, ToDeepUnistyles } from './stylesheet'
import type { TransformStyles } from './core'
import type { UnistylesRuntime } from '../core'

type ExtractTransformArray<T> = T extends object
    ? { [K in keyof T]: ExtractBreakpoints<T[K]> }
    : never

type ExtractBreakpoints<T> = T extends object
    ? keyof T extends BreakpointsOrMediaQueries
        ? T[keyof T]
        : T extends Array<ToDeepUnistyles<TransformStyles>>
            ? Array<ExtractTransformArray<T[number]>>
            : {
                [K in keyof T]: ExtractBreakpoints<T[K]>
            }
    : T

type ParseNestedObject<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => ParseNestedObject<R>
    : T extends object
        ? T extends { variants: infer R }
            ? ParseVariants<FlattenVariants<R>> & ParseNestedObject<Omit<T, 'variants'>>
            : {
                [K in keyof T]: T[K] extends object
                    ? T[K] extends OpaqueColorValue
                        ? ColorValue
                        : ExtractBreakpoints<T[K]>
                    : T[K]
            }
        : T

type FlattenVariants<T> = T extends object
    ? {
        [K in keyof T]: T[K] extends object
            ? {
                [key in keyof T[K]]: T[K][key] extends object
                    ? ParseNestedObject<T[K][key]>
                    : never
            }
            : never
    }
    : never

type ParseVariants<T> = T extends object
    ? T[keyof T] extends object
        ? UnionToIntersection<ParseVariants<T[keyof T]>>
        : T
    : T

type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ParseStyleKeys<T> = T extends object
    ? { [K in keyof T]: ParseNestedObject<T[K]> }
    : never

export type ReactNativeStyleSheet<T> = T extends (theme: UnistylesTheme, runtime: UnistylesRuntime) => infer R
    ? ParseStyleKeys<R>
    : ParseStyleKeys<T>
