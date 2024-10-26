import type { ColorValue, OpaqueColorValue } from 'react-native'
import type { UnistylesTheme } from '../types'
import type { BreakpointsOrMediaQueries, ToDeepUnistyles } from './stylesheet'
import type { TransformStyles } from './core'
import type { UnistylesMiniRuntime } from '../core'

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

type ParseNestedObject<T, ShouldFlatten> = T extends (...args: infer A) => infer R
    ? (...args: A) => ParseNestedObject<R, false>
    : T extends object
        ? T extends { variants: infer R }
            // if intersection of Base and Variants is never, then flatten variants to generic "string"
            ? (ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false>) extends never
                ? ParseVariants<FlattenVariants<R, true>> & ParseNestedObject<Omit<T, 'variants'>, false>
                : ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false>
            : {
                [K in keyof T]: T[K] extends object
                    ? T[K] extends OpaqueColorValue
                        ? ColorValue
                        : ExtractBreakpoints<T[K]>
                    : T[K] extends string
                        ? ShouldFlatten extends true
                            ? string
                            : T[K]
                        : T[K]
            }
        : T

type FlattenVariants<T, ShouldFlatten> = T extends object
    ? {
        [K in keyof T]: T[K] extends object
            ? {
                [key in keyof T[K]]: T[K][key] extends object
                    ? ParseNestedObject<T[K][key], ShouldFlatten>
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
    ? { [K in keyof T]: ParseNestedObject<T[K], false> }
    : never

export type ReactNativeStyleSheet<T> = T extends (theme: UnistylesTheme, runtime: UnistylesMiniRuntime) => infer R
    ? ParseStyleKeys<R>
    : ParseStyleKeys<T>
