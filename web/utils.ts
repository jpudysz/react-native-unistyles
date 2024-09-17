import { ColorScheme, type AppThemeName} from '../src/specs/types'
import type { UnistylesValues } from '../src/types'

export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

export const toReactNativeClassName = (className: string, values: UnistylesValues) => {
    const returnValue = {
        $$css: true,
        'unistyles-class': className
    }

    Object.defineProperties(returnValue, reduceObject(values, value => ({
        value,
        enumerable: false,
        configurable: true
    })))

    return new Proxy(returnValue, {
        get: (target, prop) => {
            if (!keyInObject(target, prop)) {
                return undefined
            }

            const value = target[prop]

            if (!isServer() && typeof value === 'string' && value.startsWith('var(--')) {
                return window.getComputedStyle(document.documentElement).getPropertyValue(value.slice(4, -1))
            }

            return value
        }
    })
}

export const keyInObject = <T extends Record<string, any>>(obj: T, key: PropertyKey): key is keyof T => key in obj

export const camelToKebab = (str: string) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()

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

export const isDefined = <T>(value: T | undefined | null): value is NonNullable<T> => value !== undefined && value !== null

export const warn = (message: string) => console.warn(`🦄 [react-native-unistyles] ${message}`)
