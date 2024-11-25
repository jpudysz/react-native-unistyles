import type { UnistyleDependency } from '../../specs/NativePlatform'
import { ColorScheme, Orientation } from '../../specs/types'
import type { StyleSheet, StyleSheetWithSuperPowers, UnistylesValues } from '../../types/stylesheet'
import { isUnistylesMq, parseMq } from '../../mq'
import { UnistylesState } from '../state'
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
    __uni__refs: Set<HTMLElement>
    __uni__variants: Record<string, any>
    __uni__args?: Array<any>
}

export const assignSecrets = <T>(object: T, secrets: UnistyleSecrets) => {
    // @ts-expect-error - assign secrets to object
    object.__uni__secrets__ = secrets

    return object
}

export const extractSecrets = (object: any) => {
    return keyInObject(object, '__uni__secrets__') ? object.__uni__secrets__ as UnistyleSecrets : undefined
}

export const getStyles = (values: UnistylesValues) => {
    const returnValue = {}

    Object.defineProperties(returnValue, reduceObject(values, value => ({
        value,
        enumerable: false,
        configurable: true
    })))

    return returnValue
}

export const isInDocument = (element: HTMLElement) => document.body.contains(element)

export const extractMediaQueryValue = (query: string) => {
    const [_, px] = query.match(/(\d+)px/) ?? []

    if (!px) {
        return undefined
    }

    const value = Number(px)

    return Number.isNaN(value)
        ? undefined
        : value
}

export const getMediaQuery = (query: string) => {
    if (Object.values(Orientation).includes(query as Orientation)) {
        return `(orientation: ${query})`
    }

    if (isUnistylesMq(query)) {
        const { minWidth, maxWidth, minHeight, maxHeight } = parseMq(query)

        return [
            minWidth ? `(min-width: ${minWidth}px)` : undefined,
            maxWidth ? `(max-width: ${maxWidth}px)` : undefined,
            minHeight ? `(min-height: ${minHeight}px)` : undefined,
            maxHeight ? `(max-height: ${maxHeight}px)` : undefined
        ].filter(Boolean).join(' and ')
    }

    const minWidth = UnistylesState.breakpoints && keyInObject(UnistylesState.breakpoints, query) ? UnistylesState.breakpoints[query] : undefined

    return `(min-width: ${minWidth ?? 0}px)`
}

export const extractUnistyleDependencies = (value: any) => {
    if (!value) {
        return []
    }

    const dependencies: Array<UnistyleDependency> = keyInObject(value, 'uni__dependencies') ? value.uni__dependencies : []

    return Array.isArray(dependencies) ? dependencies : []
}
