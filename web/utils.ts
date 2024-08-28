import type { NestedCSSProperties } from 'typestyle/lib/types'
import type { UnistylesValues } from '../src/types'

export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

// TODO: create implementation
export const convertToTypeStyle = (value: UnistylesValues) => value as unknown as NestedCSSProperties

export const toReactNativeClassName = (className: string) => ({
    $$css: true,
    'unistyles-class': className
})
