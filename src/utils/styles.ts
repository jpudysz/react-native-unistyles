import type { CustomNamedStyles, ScreenSize, NestedStyle } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import { normalizeStyles } from './normalizeStyles'
import type { UnistylesBreakpoints } from '../global'
import { isAndroid, isIOS, isWeb } from './common'
import { getKeyForVariant } from './variants'

export const proxifyFunction = (
    fn: Function, breakpoint: keyof UnistylesBreakpoints & string,
    screenSize: ScreenSize,
    variant?: string
): Function => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) =>
        parseStyle(target.apply(thisArg, argumentsList), breakpoint, screenSize, variant)
})

export const isPlatformColor = <T extends {}>(value: T): boolean => {
    if (isIOS) {
        return 'semantic' in value && typeof value.semantic === 'object'
    }

    return isAndroid && 'resource_paths' in value && typeof value.resource_paths === 'object'
}

export const parseStyle = <T>(
    style: CustomNamedStyles<T>,
    breakpoint: keyof UnistylesBreakpoints & string,
    screenSize: ScreenSize,
    variant?: string
): T => {
    const entries = (Object
        .entries(style || {}) as Array<[keyof T, CustomNamedStyles<T> | NestedStyle]>)
        .map(([key, value]) => {
            if (key !== 'variants') {
                return [key, value]
            }

            const variantKey = getKeyForVariant(
                value as NestedStyle,
                variant
            )

            if (!variantKey) {
                return undefined
            }

            return Object
                .entries(value[variantKey as keyof typeof value] as NestedStyle)
                .flat()
        })
        .filter(Boolean) as Array<[keyof T, CustomNamedStyles<T> | NestedStyle]>

    const parsedStyles = Object
        .fromEntries(entries
            .map(([key, value]) => {
                const hasNestedProperties = key === 'shadowOffset' || key === 'textShadowOffset'

                if (hasNestedProperties) {
                    return [
                        key,
                        parseStyle(value as CustomNamedStyles<T>, breakpoint, screenSize, variant)
                    ]
                }

                const isTransform = key === 'transform'

                if (isTransform && Array.isArray(value)) {
                    return [
                        key,
                        value.map(value => parseStyle(value, breakpoint, screenSize, variant))
                    ]
                }

                const isDynamicFunction = typeof value === 'function'
                const isValidStyle = typeof value !== 'object' || isPlatformColor(value)

                if (isDynamicFunction || isValidStyle) {
                    return [key, value]
                }

                return [
                    key,
                    getValueForBreakpoint(value as NestedStyle)
                ]
            })
        )

    return isWeb
        ? normalizeStyles(parsedStyles)
        : parsedStyles
}
