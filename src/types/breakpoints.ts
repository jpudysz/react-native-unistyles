import type { OpaqueColorValue } from 'react-native'
import type { UnistylesBreakpoints } from '../global'
import type { MediaQuery } from './mq'

type WithEmptyObject<V> = keyof V extends never ? {} : V

type ExtractBreakpoints<T> = T extends Partial<Record<keyof UnistylesBreakpoints & string, infer V>>
    ? WithEmptyObject<V>
    : T extends (...args: infer A) => infer R
        ? (...args: A) => ExtractBreakpoints<R>
        : {
            [K in keyof T]: T[K] extends (...args: infer A) => infer R
                ? (...args: A) => ExtractBreakpoints<R>
                : T[K] extends object
                    ? ExtractBreakpoints<T[K]>
                    : T[K]
        }

type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type RemoveKeysWithPrefix<T> = T extends (...args: Array<any>) => infer R
    ? (...args: Parameters<T>) => RemoveKeysWithPrefix<R>
    : T extends object
        ? T extends OpaqueColorValue
            ? string
            : T extends Record<string, infer _V>
                ? T extends { variants: infer _V }
                    ? Omit<T, 'variants'> & UnionToIntersection<_V[keyof _V]>
                    : { [K in keyof T as K extends MediaQuery ? keyof UnistylesBreakpoints & string : K]: RemoveKeysWithPrefix<T[K]> }
                : { [K in keyof T]: RemoveKeysWithPrefix<T[K]> }
        : T

export type ReactNativeStyleSheet<T> = ExtractBreakpoints<RemoveKeysWithPrefix<T>>
