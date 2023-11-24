import type { ColorValue, OpaqueColorValue } from 'react-native'
import type { UnistylesTheme } from '../types'
import type { AllAvailableKeys, BreakpointsOrMediaQueries } from './stylesheet'

type WithEmptyObject<V> = keyof V extends never ? {} : V

type ExtractBreakpoints<T> = T extends Partial<Record<BreakpointsOrMediaQueries, infer R>>
    ? WithEmptyObject<R>
    : {
        [K in keyof T]: T[K] extends object
            ? T[K] extends OpaqueColorValue
                ? ColorValue
                : ExtractBreakpoints<T[K]>
            : T[K]
    }

type ParseNestedObject<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => ParseNestedObject<R>
    : keyof T extends AllAvailableKeys
        ? ExtractBreakpoints<T>
        : T extends { variants: infer R }
            ? ParseVariants<FlattenVariants<R>> & ParseNestedObject<Omit<T, 'variants'>>
            : {
                [K in keyof T]: T[K] extends object
                    ? T[K] extends OpaqueColorValue
                        ? ColorValue
                        : ExtractBreakpoints<T[K]>
                    : T[K]
            }

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
        ? ParseVariants<T[keyof T]>
        : T
    : T

type ParseStyleKeys<T> = T extends object
    ? { [K in keyof T]: ParseNestedObject<T[K]> }
    : never

export type ReactNativeStyleSheet<T> = T extends (theme: UnistylesTheme) => infer R
    ? ParseStyleKeys<R>
    : ParseStyleKeys<T>
