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
