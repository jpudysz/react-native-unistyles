import type { Optional, RNStyle, RNValue } from '../types'
import { getValueForBreakpoint } from './breakpoints'
import { isAndroid, isIOS } from '../common'
import { withPlugins } from './withPlugins'

export const proxifyFunction = (
    key: string,
    fn: Function,
    variant?: Record<string, Optional<string>>
): Function => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) => withPlugins(key, parseStyle(target.apply(thisArg, argumentsList), variant))
})

export const isPlatformColor = <T extends {}>(value: T): boolean => {
    if (isIOS) {
        return 'semantic' in value && typeof value.semantic === 'object'
    }

    return isAndroid && 'resource_paths' in value && typeof value.resource_paths === 'object'
}

export const parseStyle = <T extends RNStyle>(
    style: T,
    variant: Record<string, Optional<string>> = {},
    parseMediaQueries = true
): T => Object
    .entries(style || {})
    .reduce((acc, [key, value]) => {
        // nested objects
        if (key === 'shadowOffset' || key  === 'textShadowOffset') {
            acc[key] = parseStyle(value, variant)

            return acc
        }

        // transforms
        if (key === 'transform' && Array.isArray(value)) {
            acc[key] = value.map(value => parseStyle(value, variant))

            return acc
        }

        if (key === 'fontVariant' && Array.isArray(value)) {
            acc[key] = value

            return acc
        }

        // values or platform colors
        if (typeof value !== 'object' || isPlatformColor(value)) {
            acc[key as keyof T] = value

            return acc
        }

        if (key === 'variants') {
            return {
                ...acc,
                ...(Object
                    .keys(value) as Array<keyof typeof value>)
                    .reduce((acc, key) => ({
                        ...acc,
                        // this will parse the styles of the selected variant (or default if it is undefined), if selected variant has no styles then it will fallback to default styles
                        ...parseStyle((value)[key][variant[key as keyof typeof variant]?.toString() || 'default'] ?? (value)[key].default ?? {})
                    }), {})
            }
        }

        // don't parse media queries and breakpoints
        if (!parseMediaQueries) {
            return {
                ...acc,
                [key]: value
            }
        }

        return {
            ...acc,
            [key]: getValueForBreakpoint(value as Record<string, RNValue>)
        }
    }, {} as T)
