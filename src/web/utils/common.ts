export const reduceObject = <TObj extends Record<string, any>, TReducer>(
    obj: TObj,
    reducer: (value: TObj[keyof TObj], key: keyof TObj) => TReducer,
) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, reducer(value as TObj[keyof TObj], key)])) as { [K in keyof TObj]: TReducer }

export const keyInObject = <T extends Record<string, any>>(obj: T, key: PropertyKey): key is keyof T => key in obj

export const isServer = () => typeof window === 'undefined' || typeof document === 'undefined'

export const error = (message: string) => new Error(`Unistyles: ${message}`)

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

export const hyphenate = (propertyName: string) => propertyName.replace(/[A-Z]/g, (m: string) => `-${m.toLowerCase()}`)

export const serialize = (obj: string | number | object): string => {
    if (typeof obj !== 'object') {
        return String(obj)
    }

    const sortedKeys = Object.keys(obj).sort()
    const sortedKeyValuePairs = sortedKeys.map(key => `${key}:${serialize(obj[key as keyof typeof obj])}`)

    return `{${sortedKeyValuePairs.join(',')}}`
}

// Based on https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
const cyrb53 = (data: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed

    for (let i = 0, ch: number; i < data.length; i++) {
        ch = data.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

    return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export const generateHash = (value: any) => {
    const serialized = serialize(value)

    return `unistyles_${cyrb53(serialized).toString(36)}`
}
