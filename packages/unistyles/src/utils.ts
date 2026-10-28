export const isDefined = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null

// Reanimated useAnimatedStyle handle, it's a plain object, not an Animated.Node
// styleUpdaterContainer was added in Reanimated 4.1, so check only the keys every version has
export const isAnimatedStyleHandle = (value: unknown): boolean =>
    typeof value === 'object' && value !== null && 'viewDescriptors' in value && 'initial' in value

export const deepMergeObjects = <T extends Record<PropertyKey, any>>(...sources: Array<T>) => {
    const target = {} as T

    sources.filter(isDefined).forEach((source) => {
        Object.keys(source).forEach((key) => {
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

// React tells a class component from a function component by these keys
const CLASS_PROTOTYPE_KEYS = ['isReactComponent', 'render']
const CLASS_STATIC_KEYS = ['contextType', 'contextTypes', 'childContextTypes', 'getDerivedStateFromProps']

// owner doesn't have the key, objects that inherit from owner read it from source
const hideFromOwner = (owner: object, source: object, key: string) => {
    Object.defineProperty(owner, key, {
        configurable: true,
        get() {
            return this === owner ? undefined : Reflect.get(source, key, this)
        },
        set(value) {
            Object.defineProperty(this, key, { value, writable: true, enumerable: true, configurable: true })
        },
    })
}

const inheritNativeClass = (Component: any, UnistylesComponent: (props: unknown) => unknown) => {
    function UnistylesClassComponent(this: unknown, ...args: Array<unknown>) {
        if (this instanceof UnistylesClassComponent) {
            return Reflect.construct(Component, args, new.target ?? this.constructor)
        }

        return UnistylesComponent(args[0])
    }

    Object.setPrototypeOf(UnistylesClassComponent, Component)
    UnistylesClassComponent.prototype = Object.create(Component.prototype, {
        constructor: { value: UnistylesClassComponent, writable: true, configurable: true },
    })
    // only the keys of the class, eg. React warns about a subclass with a `contextType` key that isn't a context
    CLASS_PROTOTYPE_KEYS.filter((key) => key in Component.prototype).forEach((key) =>
        hideFromOwner(UnistylesClassComponent.prototype, Component.prototype, key),
    )
    CLASS_STATIC_KEYS.filter((key) => key in Component).forEach((key) =>
        hideFromOwner(UnistylesClassComponent, Component, key),
    )

    return UnistylesClassComponent
}

export const copyComponentProperties = (Component: any, UnistylesComponent: any) => {
    // static properties (eg. displayName) are inherited from the class
    if (Component?.prototype?.isReactComponent && typeof UnistylesComponent === 'function') {
        return inheritNativeClass(Component, UnistylesComponent)
    }

    Object.entries(Component).forEach(([key, value]) => {
        // Filter out the keys we don't want to copy
        if (['$$typeof', 'render', 'contextType'].includes(key)) {
            return
        }

        UnistylesComponent[key] = value
    })

    UnistylesComponent.displayName = Component.displayName

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
    const isWidthValid =
        parsedMQ.minWidth === undefined || parsedMQ.maxWidth === undefined || parsedMQ.minWidth <= parsedMQ.maxWidth
    const isHeightValid =
        parsedMQ.minHeight === undefined || parsedMQ.maxHeight === undefined || parsedMQ.minHeight <= parsedMQ.maxHeight

    return isWidthValid && isHeightValid
}
