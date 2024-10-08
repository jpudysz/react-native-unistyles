import { ColorScheme, type AppThemeName} from '../specs/types'
import type { UnistylesValues } from '../types'

export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

export const toReactNativeClassName = (className: string | null, values: UnistylesValues) => {
    const returnValue = className ? {
        $$css: true,
        [className]: className
    } : {}

    Object.defineProperties(returnValue, reduceObject(values, value => ({
        value,
        enumerable: false,
        configurable: true
    })))

    return returnValue
}

export const keyInObject = <T extends Record<string, any>>(obj: T, key: PropertyKey): key is keyof T => key in obj

export const schemeToTheme = (scheme: ColorScheme): AppThemeName => {
    switch (scheme) {
        case ColorScheme.Dark:
            return 'dark'
        case ColorScheme.Light:
        default:
            return 'light'
    }
}

export const hexToRGBA = (hex: string, opacity: number) => hex
    .replace('#', '')
    .split(/(?=(?:..)*$)/)
    .map(x => parseInt(x, 16))
    .filter(num => !isNaN(num))
    .reduce((acc, color) => `${acc}${color},`, 'rgba(')
    .concat(`${opacity})`)

export const isServer = () => typeof window === 'undefined'

/**
* Deeply merges properties of passed object
*/
export const deepMergeObjects = <T extends Record<PropertyKey, any>>(...sources: Array<T>) => {
    const target = {} as T

    sources.forEach(source => {
        Object.keys(source).forEach(key => {
            const sourceValue = source[key]
            const targetValue = target[key]

            if (Object(sourceValue) == sourceValue && Object(targetValue) === targetValue) {
                // @ts-expect-error - can't assign to generic
                target[key] = deepMergeObjects(targetValue, sourceValue)

                return
            }

            // @ts-expect-error - can't assign to generic
            target[key] = sourceValue
        })
    })

    return target
}

export const warn = (message: string) => console.warn(`🦄 [react-native-unistyles] ${message}`)

export const equal = <T>(a: T, b: T) => {
    if (Object.is(a, b)) {
        return true
    }

    if (
        typeof a !== 'object'
        || a === null
        || typeof b !== 'object'
        || b === null
    ) {
        return false
    }

    const keysA = Object.keys(a) as Array<keyof T>

    if (keysA.length !== Object.keys(b).length) {
        return false
    }

    return keysA.every(key => Object.is(a[key], b[key]) && Object.prototype.hasOwnProperty.call(b, key))
}
