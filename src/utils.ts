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
