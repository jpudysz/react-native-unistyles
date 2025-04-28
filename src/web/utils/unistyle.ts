import { Animated } from 'react-native'
import type { UnistylesBreakpoints } from '../../global'
import { isUnistylesMq, parseMq } from '../../mq'
import type { UnistyleDependency } from '../../specs/NativePlatform'
import { ColorScheme, Orientation } from '../../specs/types'
import type { StyleSheet, StyleSheetWithSuperPowers, UnistylesValues } from '../../types/stylesheet'
import * as unistyles from '../services'
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

    return reduceObject(Object.getOwnPropertyDescriptors(secrets), secret => secret.value)
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

    const breakpointValue = unistyles.services.runtime.breakpoints[query as keyof UnistylesBreakpoints] ?? 0
    const nextBreakpoint = allBreakpoints
        .filter((b): b is keyof UnistylesBreakpoints => b in unistyles.services.runtime.breakpoints)
        .map(b => unistyles.services.runtime.breakpoints[b] as number)
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

export const checkForProp = (value: any, prop: string): boolean => {
    if (Array.isArray(value)) {
        return value.some(nestedValue => checkForProp(nestedValue, prop))
    }

    if (typeof value === 'object' && value !== null) {
        return keyInObject(value, prop)
            ? true
            : keyInObject(value, '_web')
                ? checkForProp(value._web, prop)
                : false
    }

    return false
}

export const checkForAnimated = (value: any): boolean => {
    if (Array.isArray(value)) {
        return value.some(checkForAnimated)
    }

    if (typeof value === 'object' && value !== null) {
        const objectValues = Object.values(value)
        const secrets = extractSecrets(value)

        // @ts-expect-error React Native Web exports Animated.AnimatedNode as Animated.Node
        return value instanceof Animated.Node ||
            objectValues.length > 0 && objectValues.some(checkForAnimated) ||
            secrets && Object.keys(secrets).length === 0
    }

    return false
}
