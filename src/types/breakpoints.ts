import type { UnistylesBreakpoints } from '../global'
import type { MediaQueries } from './mediaQueries'

export type ScreenSize = {
    width: number,
    height: number
}

export type CreateStylesFactory<ST, Theme> = (theme: Theme) => ST

type WithEmptyObject<V> = keyof V extends never ? {} : V

export type ExtractBreakpoints<T> = T extends Partial<Record<keyof UnistylesBreakpoints & string, infer V>>
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

export type RemoveKeysWithPrefix<T> = T extends (...args: Array<any>) => infer R
    ? (...args: Parameters<T>) => RemoveKeysWithPrefix<R>
    : T extends object
        ? T extends Record<string, infer _V>
            ? { [K in keyof T as K extends MediaQueries ? keyof UnistylesBreakpoints & string : K]: RemoveKeysWithPrefix<T[K]> }
            : { [K in keyof T]: RemoveKeysWithPrefix<T[K]> }
        : T
