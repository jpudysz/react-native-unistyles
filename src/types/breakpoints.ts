import type { SafeReturnType } from './common'
import type { TransformStyles } from './core'
import type { BreakpointsOrMediaQueries, ToDeepUnistyles, UnistylesValue } from './stylesheet'

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
        ? T extends { variants: infer R, compoundVariants: infer C }
            // // if intersection of Base, Variants and Compound Variants is never, then flatten variants and compound variants to generic "string"
            ? (ParseVariants<FlattenVariants<R, false>> & FlattenCompoundVariants<C, false> & ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false>) extends never
                ? ParseVariants<FlattenVariants<R, true>> & FlattenCompoundVariants<C, true> & ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false>
                : ParseVariants<FlattenVariants<R, false>> & FlattenCompoundVariants<C, false> & ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false>
            : T extends { variants: infer R }
                // if intersection of Base and Variants is never, then flatten variants to generic "string"
                ? (ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false>) extends never
                    ? ParseVariants<FlattenVariants<R, true>> & ParseNestedObject<Omit<T, 'variants'>, false>
                    : ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false>
                : T extends { compoundVariants: object }
                    ? ParseNestedObject<Omit<T, 'compoundVariants'>, false>
                    : {
                        [K in keyof T as K extends '_web' ? never : K]: T[K] extends object
                            ? ExtractBreakpoints<T[K]>
                            : T[K] extends string
                                ? ShouldFlatten extends true
                                    ? string
                                    : T[K]
                                : T[K] extends UnistylesValue<infer V>
                                    ? V
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

type FlattenCompoundVariants<T, ShouldFlatten> = T extends Array<infer _>
    ? FlattenCompoundVariants<T[number], ShouldFlatten>
    : T extends { styles: infer S }
        ? ParseNestedObject<S, ShouldFlatten>
        : never

type ParseVariants<T> = T extends object
    ? T[keyof T] extends object
        ? UnionToIntersection<ParseVariants<T[keyof T]>> extends never
            ? ParseVariants<T[keyof T]>
            : UnionToIntersection<ParseVariants<T[keyof T]>>
        : T
    : T

type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ParseStyleKeys<T> = T extends object
    ? { [K in keyof T]: ParseNestedObject<T[K], false> }
    : never

export type ReactNativeStyleSheet<T> = ParseStyleKeys<SafeReturnType<T>>
