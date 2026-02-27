import type { ColorValue, OpaqueColorValue } from 'react-native'

import type { SafeReturnType, UnionToIntersection } from './common'
import type { TransformStyles } from './core'
import type { BreakpointsOrMediaQueries, ToDeepUnistyles } from './stylesheet'

type ExtractTransformArray<T> = T extends object ? { [K in keyof T]: ExtractBreakpoints<T[K]> } : never

type ExtractBreakpoints<T> = T extends object
    ? keyof T extends BreakpointsOrMediaQueries
        ? T[keyof T]
        : T extends Array<ToDeepUnistyles<TransformStyles>>
          ? Array<ExtractTransformArray<T[number]>>
          : T extends Array<infer _U>
            ? T
            : {
                  [K in keyof T]: ExtractBreakpoints<T[K]>
              }
    : T

// Helper type to check if the base styles (without variants) are truly empty or just {}
type IsEmptyObject<T> = T extends Record<string, never> ? true : keyof T extends never ? true : false

type ParseNestedObject<T, ShouldFlatten> = T extends (...args: infer A) => infer R
    ? (...args: A) => ParseNestedObject<R, false>
    : T extends object
      ? T extends { variants: infer R; compoundVariants: infer C }
          ? ParseVariants<FlattenVariants<R, false>> &
                FlattenCompoundVariants<C, false> &
                ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false> extends never
              ? ParseVariants<FlattenVariants<R, true>> &
                    FlattenCompoundVariants<C, true> &
                    ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false>
              : ParseVariants<FlattenVariants<R, false>> &
                    FlattenCompoundVariants<C, false> &
                    ParseNestedObject<Omit<T, 'variants' | 'compoundVariants'>, false>
          : T extends { variants: infer R }
            ? IsEmptyObject<ParseNestedObject<Omit<T, 'variants'>, false>> extends true
                ? ParseVariants<FlattenVariants<R, false>>
                : ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false> extends never
                  ? ParseVariants<FlattenVariants<R, true>> & ParseNestedObject<Omit<T, 'variants'>, false>
                  : ParseVariants<FlattenVariants<R, false>> & ParseNestedObject<Omit<T, 'variants'>, false>
            : T extends { compoundVariants: object }
              ? ParseNestedObject<Omit<T, 'compoundVariants'>, false>
              : {
                    [K in keyof T as K extends '_web' ? never : K]: T[K] extends object
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
                    [key in keyof T[K]]: T[K][key] extends object ? ParseNestedObject<T[K][key], ShouldFlatten> : never
                }
              : never
      }
    : never

type FlattenCompoundVariants<T, ShouldFlatten> =
    T extends Array<infer _>
        ? FlattenCompoundVariants<T[number], ShouldFlatten>
        : T extends { styles: infer S }
          ? ParseNestedObject<S, ShouldFlatten>
          : never

type IsNonEmpty<T> = T extends object ? (keyof T extends never ? false : true) : false

type IntersectCategoryValues<T> = T extends object
    ? T extends Array<any>
        ? T
        : UnionToIntersection<T[keyof T]> extends infer R
          ? R extends never
              ? T[keyof T]
              : R
          : never
    : never

type MergeVariantCategories<T> = T extends object
    ? UnionToIntersection<
          {
              [K in keyof T]: IsNonEmpty<T[K]> extends true ? T[K] : never
          }[keyof T]
      > extends infer R
        ? R extends never
            ? NonNullable<T[keyof T]>
            : R
        : never
    : never

type ParseVariants<T> = T extends object
    ? T[keyof T] extends object
        ? T[keyof T] extends Array<any>
            ? T
            : MergeVariantCategories<{
                  [K in keyof T]: T[K] extends object ? IntersectCategoryValues<T[K]> : never
              }>
        : T
    : T

type ParseStyleKeys<T> = T extends object ? { [K in keyof T]: ParseNestedObject<T[K], false> } : never

export type ReactNativeStyleSheet<T> = ParseStyleKeys<SafeReturnType<T>>
