import React from 'react'

import * as unistyles from '../web/services'
import { getStyleResourceId, UNISTYLES_PRECEDENCE } from '../web/styleResource'
import { isServer } from '../web/utils/common'

const serverReact = React as typeof React & {
    cache?: <TArgs extends Array<unknown>, TResult>(factory: (...args: TArgs) => TResult) => (...args: TArgs) => TResult
    cacheSignal?: () => AbortSignal | null
}

const getCachedServerComponentMarker = serverReact.cache?.(() => ({}))
const createServerStyleElement = (href: string, css: string) =>
    React.createElement('style', { href, precedence: UNISTYLES_PRECEDENCE }, css)
// Reusing the element lets Flight serialize a resource once while remaining
// safe when React abandons and retries a suspended render.
const getCachedServerStyleElement = serverReact.cache?.(createServerStyleElement) ?? createServerStyleElement

export const isReactServerComponentRender = () => {
    if (!isServer()) {
        return false
    }

    if (serverReact.cacheSignal) {
        return Boolean(serverReact.cacheSignal())
    }

    return Boolean(
        getCachedServerComponentMarker && getCachedServerComponentMarker() === getCachedServerComponentMarker(),
    )
}

const getMetadata = (className: unknown) => {
    if (!Array.isArray(className)) {
        return undefined
    }

    const [metadata] = className

    if (typeof metadata !== 'object' || metadata === null) {
        return undefined
    }

    return metadata
}

export const getServerUnistylesStyle = (classNames: Array<unknown>) => {
    if (!isReactServerComponentRender()) {
        return null
    }

    const metadata = classNames.map(getMetadata).filter((value): value is object => Boolean(value))
    const resourceIds: Array<string> = []
    const fallbackHashes: Array<string> = []

    metadata.forEach((value) => {
        const resourceId = getStyleResourceId(value)

        if (resourceId) {
            resourceIds.push(resourceId)
            return
        }

        if ('hash' in value && typeof value.hash === 'string') {
            fallbackHashes.push(value.hash)
        }
    })

    const resourceHrefs = new Set<string>()
    const resources = [
        ...unistyles.services.registry.css.getStylesheetResources(resourceIds),
        ...unistyles.services.registry.css.getStylesheetResourcesForHashes(fallbackHashes),
    ].filter(({ href }) => {
        if (resourceHrefs.has(href)) {
            return false
        }

        resourceHrefs.add(href)
        return true
    })

    if (resources.length === 0) {
        return null
    }

    return React.createElement(
        React.Fragment,
        null,
        ...resources.map(({ css, href }) => getCachedServerStyleElement(href, css)),
    )
}
