import type { MediaQueries } from './mediaQueries'

export type Breakpoints = Record<string, number>
export type SortedBreakpointEntries<B extends Breakpoints> = [[keyof B & string, number]]

export type ScreenSize = {
    width: number,
    height: number
}

export type CreateStylesFactory<ST, Theme> = (theme: Theme) => ST

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
            ? { [K in keyof T as K extends MediaQueries ? keyof B & string : K]: RemoveKeysWithPrefix<T[K], B> }
            : { [K in keyof T]: RemoveKeysWithPrefix<T[K], B> }
        : T
