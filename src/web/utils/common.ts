export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

export const keyInObject = <T extends Record<string, any>>(obj: T, key: PropertyKey): key is keyof T => key in obj

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

export const generateHash = (value: any) => {
    const str = JSON.stringify(value)
    let hasher = 5381
    let length = str.length

    while (length--) hasher = (hasher * 33) ^ str.charCodeAt(length)

    return `unistyles-${(hasher >>> 0).toString(36)}`
}

export const createDoubleMap = <TKey, TSecondKey, TValue>() => {
    const map = new Map<TKey, Map<TSecondKey, TValue>>()

    return {
        get: (key: TKey, secondKey: TSecondKey) => {
            const mapForKey = map.get(key)

            if (!mapForKey) {
                return undefined
            }

            return mapForKey.get(secondKey)
        },
        set: (key: TKey, secondKey: TSecondKey, value: TValue) => {
            const mapForKey = map.get(key) ?? new Map<TSecondKey, TValue>()

            map.set(key, mapForKey)
            mapForKey.set(secondKey, value)
        },
        delete: (key: TKey, secondKey: TSecondKey) => {
            const mapForKey = map.get(key)

            if (!mapForKey) {
                return
            }

            mapForKey.delete(secondKey)
        },
        forEach: (callback: (key: TKey, secondKey: TSecondKey, value: TValue) => void) => {
            map.forEach((mapForKey, key) => {
                mapForKey.forEach((value, secondKey) => {
                    callback(key, secondKey, value)
                })
            })
        }
    }
}
