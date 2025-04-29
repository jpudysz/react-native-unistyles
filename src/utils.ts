export const isDefined = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null

export const deepMergeObjects = <T extends Record<PropertyKey, any>>(...sources: Array<T>) => {
    const target = {} as T

    sources
        .filter(isDefined)
        .forEach(source => {
            Object.keys(source).forEach(key => {
                const sourceValue = source[key]
                const targetValue = target[key]

                if (Object(sourceValue) === sourceValue && Object(targetValue) === targetValue) {
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

export const copyComponentProperties = (Component: any, UnistylesComponent: any) => {
    Object.entries(Component).forEach(([key, value]) => {
        // Filter out the keys we don't want to copy
        if (['$$typeof', 'render'].includes(key)) {
            return
        }

        UnistylesComponent[key] = value
    })

    // Those are not enumerable, so we need to copy them manually
    UnistylesComponent.displayName = Component.displayName
    UnistylesComponent.name = Component.name

    return UnistylesComponent
}

const IS_UNISTYLES_REGEX = /:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_WIDTH_REGEX = /:(w)\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_HEIGHT_REGEX = /:(h)\[(\d+)(?:,\s*(\d+|Infinity))?]/

export const isUnistylesMq = (mq: string) => IS_UNISTYLES_REGEX.test(mq)

export const parseMq = (mq: string) => {
    const [, width, fromW, toW] = UNISTYLES_WIDTH_REGEX.exec(mq) || []
    const [, height, fromH, toH] = UNISTYLES_HEIGHT_REGEX.exec(mq) || []

    return {
        minWidth: !width || fromW === 'Infinity' ? undefined : Number(fromW),
        maxWidth: !width || toW === 'Infinity' ? undefined : Number(toW),
        minHeight: !height || fromH === 'Infinity' ? undefined : Number(fromH),
        maxHeight: !height || toH === 'Infinity' ? undefined : Number(toH),
    }
}

export const isValidMq = (parsedMQ: ReturnType<typeof parseMq>) => {
    const isWidthValid = parsedMQ.minWidth === undefined || parsedMQ.maxWidth === undefined || parsedMQ.minWidth <= parsedMQ.maxWidth
    const isHeightValid = parsedMQ.minHeight === undefined || parsedMQ.maxHeight === undefined || parsedMQ.minHeight <= parsedMQ.maxHeight

    return isWidthValid && isHeightValid
}
