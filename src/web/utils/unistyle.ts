import type { UnistylesBreakpoints } from '../../global'
import { isUnistylesMq, parseMq } from '../../mq'
import type { UnistyleDependency } from '../../specs/NativePlatform'
import { ColorScheme, Orientation } from '../../specs/types'
import type { StyleSheet, StyleSheetWithSuperPowers, UnistylesValues } from '../../types/stylesheet'
import { UnistylesWeb } from '../index'
import { keyInObject, reduceObject } from './common'

export const schemeToTheme = (scheme: ColorScheme) => {
    switch (scheme) {
        case ColorScheme.Dark:
            return 'dark'
        case ColorScheme.Light:
        default:
            return 'light'
    }
}

export type UnistyleSecrets = {
    __uni__stylesheet: StyleSheetWithSuperPowers<StyleSheet>,
    __uni__key: string,
    __uni__args?: Array<any>,
    __uni_variants: Record<string, string | boolean | undefined>
}

export const assignSecrets = <T>(object: T, secrets: UnistyleSecrets) => {
    const secretsId = Math.random().toString(36).slice(8)

    // @ts-expect-error assign hidden secrets
    object[`unistyles_${secretsId}`] = {}
    // @ts-expect-error assign hidden secrets
    Object.defineProperties(object[`unistyles_${secretsId}`], reduceObject(secrets, secret => ({
        value: secret,
        enumerable: false,
        configurable: true
    })))

    return object
}

export const extractSecrets = (object: any) => {
    if (!object) {
        return undefined
    }

    const [, secrets] = Object.entries(object).find(([key]) => key.startsWith('unistyles_')) ?? []

    if (!secrets) {
        return undefined
    }

    const hiddenSecrets = Object.getOwnPropertyDescriptors(secrets)

    if (Object.keys(hiddenSecrets).length === 0) {
        return undefined
    }

    return reduceObject(hiddenSecrets, secret => secret.value)
}

export const removeInlineStyles = (values: UnistylesValues) => {
    const returnValue = {}

    Object.defineProperties(returnValue, reduceObject(values, value => ({
        value,
        enumerable: false,
        configurable: true
    })))

    return returnValue
}

export const getMediaQuery = (query: string, allBreakpoints: Array<string>) => {
    if (Object.values(Orientation).includes(query as Orientation)) {
        return `@media (orientation: ${query})`
    }

    if (isUnistylesMq(query)) {
        const { minWidth, maxWidth, minHeight, maxHeight } = parseMq(query)

        const queries = [
            minWidth ? `(min-width: ${minWidth}px)` : undefined,
            maxWidth ? `(max-width: ${maxWidth}px)` : undefined,
            minHeight ? `(min-height: ${minHeight}px)` : undefined,
            maxHeight ? `(max-height: ${maxHeight}px)` : undefined
        ].filter(Boolean).join(' and ')
        return `@media ${queries}`
    }

    const breakpointValue = UnistylesWeb.runtime.breakpoints[query as keyof UnistylesBreakpoints] ?? 0
    const nextBreakpoint = allBreakpoints
        .filter((b): b is keyof UnistylesBreakpoints => b in UnistylesWeb.runtime.breakpoints)
        .map(b => UnistylesWeb.runtime.breakpoints[b] as number)
        .sort((a, b) => a - b)
        .find(b => b > breakpointValue)
    const queries = [
        `(min-width: ${breakpointValue}px)`,
        nextBreakpoint ? `(max-width: ${nextBreakpoint - 1}px)` : undefined,
    ].filter(Boolean).join(' and ')

    return `@media ${queries}`
}

export const extractUnistyleDependencies = (value: any) => {
    if (!value) {
        return []
    }

    const dependencies: Array<UnistyleDependency> = keyInObject(value, 'uni__dependencies') ? value.uni__dependencies : []

    return Array.isArray(dependencies) ? dependencies : []
}
