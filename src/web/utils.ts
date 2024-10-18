import { ColorScheme, type AppThemeName} from '../specs/types'
import type { StyleSheet, StyleSheetWithSuperPowers, UnistylesValues } from '../types/stylesheet'

export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

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

export type UnistyleSecrets = {
    __uni__stylesheet: StyleSheetWithSuperPowers<StyleSheet>,
    __uni__key: string,
    __uni__refs: Set<HTMLElement>
    __uni__variants: Record<string, any>
    __uni__args?: Array<any>
}

export const assignSecrets = <T>(object: T, secrets: UnistyleSecrets) => {
    // @ts-expect-error - assign secrets to object
    object[`__uni__secrets__${Math.random().toString(16).slice(2)}`] = secrets

    return object
}

export const extractSecrets = (object: any) => {
    const secrets = Object.entries(object).reduce((acc, [key, value]) => {
        if (key.startsWith('__uni__secrets__')) {
            acc.push(value as UnistyleSecrets)
        }

        return acc
    }, [] as Array<UnistyleSecrets>)

    return secrets
}

export const getStyles = (values: UnistylesValues) => {
    const returnValue = {}

    Object.defineProperties(returnValue, reduceObject(values, value => ({
        value,
        enumerable: false,
        configurable: true
    })))

    return returnValue
}

export const extractHiddenProperties = (object: any) => {
    const hiddenProperties = Object.getOwnPropertyNames(object)

    return Object.fromEntries(
        hiddenProperties
            .filter(key => !key.startsWith('__uni__'))
            .map(key => [key, object[key]])
    )
}

export const isInDocument = (element: HTMLElement) => document.body.contains(element)
