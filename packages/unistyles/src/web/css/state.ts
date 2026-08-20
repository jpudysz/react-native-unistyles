import { createServerStyleResources } from 'react-native-unistyles/internal/server-style-resources'

import type { UnistylesValues } from '../../types'
import type { UnistylesServices } from '../types'
import type { CSSMap as MapType, ServerStyleResources, StylesheetResource } from './serverStyleResources.types'

import { convertUnistyles } from '../convert'
import { UNISTYLES_PRECEDENCE, UNISTYLES_RESOURCE_ANCHOR_ID } from '../styleResource'
import { hyphenate, isServer } from '../utils'
import { convertToCSS } from './core'

type SetProps = {
    mediaQuery?: string
    className: string
    isMq?: boolean
    sourceHash?: string
    propertyKey: string
    value: any
}
type HydrateState = Array<[string, Array<[string, Array<[string, any]>]>]>
type RuleLocation = {
    className: string
    isMq: boolean
    mediaQuery: string
}

export type { StylesheetResource } from './serverStyleResources.types'

const CHILD_SELECTOR = ' > *'

const getSourceHash = (className: string) => {
    const childSelectorIndex = className.indexOf(CHILD_SELECTOR)

    if (childSelectorIndex !== -1) {
        return className.slice(0, childSelectorIndex + CHILD_SELECTOR.length)
    }

    const pseudoSelectorIndex = className.indexOf(':')

    return pseudoSelectorIndex === -1 ? className : className.slice(0, pseudoSelectorIndex)
}

const getLookupHash = (sourceHash: string) =>
    sourceHash.endsWith(CHILD_SELECTOR) ? sourceHash.slice(0, -CHILD_SELECTOR.length) : sourceHash

const getRuleLocationKey = ({ className, isMq, mediaQuery }: RuleLocation) =>
    `${isMq ? 'mq' : 'main'}\0${mediaQuery}\0${className}`

const safeGetMap = (map: Map<string, Map<string, any>>, key: string) => {
    const nextLevelMap = map.get(key)

    if (!nextLevelMap) {
        const newMap = new Map<string, any>()

        map.set(key, newMap)

        return newMap
    }

    return nextLevelMap
}

export class CSSState {
    mainMap: MapType = new Map()
    mqMap: MapType = new Map()
    private styleTag: HTMLStyleElement | null = null
    private themesCSS = new Map<string, string>()
    private ruleLocations = new Map<string, Map<string, RuleLocation>>()
    private sourceHashes = new Map<string, Set<string>>()
    // The conditional export returns the real O(1) resource index only in an
    // RSC module graph. Browser, Native, and regular SSR builds get a no-op.
    private serverStyleResources: ServerStyleResources | undefined = createServerStyleResources()

    constructor(private services: UnistylesServices) {
        if (isServer()) {
            return
        }

        const ssrTag = document.getElementById('unistyles-web')

        if (ssrTag) {
            this.styleTag = ssrTag as HTMLStyleElement
        } else {
            this.styleTag = document.createElement('style')
            this.styleTag.id = 'unistyles-web'
            document.head.appendChild(this.styleTag)
        }

        this.ensureRuntimeStyleOrder()
    }

    set = ({
        className,
        propertyKey,
        sourceHash = getSourceHash(className),
        value,
        mediaQuery = '',
        isMq,
    }: SetProps) => {
        const firstLevelMap = isMq ? this.mqMap : this.mainMap
        const secondLevelMap = safeGetMap(firstLevelMap, mediaQuery)
        const thirdLevelMap = safeGetMap(secondLevelMap, className)
        const lookupHash = getLookupHash(sourceHash)
        const location = {
            className,
            isMq: Boolean(isMq),
            mediaQuery,
        }
        const locations = this.ruleLocations.get(sourceHash) ?? new Map()
        const sources = this.sourceHashes.get(lookupHash) ?? new Set()

        thirdLevelMap.set(propertyKey, value)
        locations.set(getRuleLocationKey(location), location)
        sources.add(sourceHash)

        this.ruleLocations.set(sourceHash, locations)
        this.sourceHashes.set(lookupHash, sources)
        this.serverStyleResources?.set({
            className,
            declarations: thirdLevelMap,
            isMq: Boolean(isMq),
            mediaQuery,
            sourceHash,
        })
    }

    add = (hash: string, values: UnistylesValues) => {
        this.removeSourceHash(hash)

        convertToCSS(hash, convertUnistyles(values, this.services.runtime), this, hash)
        this.recreate()
    }

    recreate = () => {
        if (this.styleTag) {
            // Keep the mutable runtime sheet after persisted RSC resources so
            // equal-specificity dependency updates win without changing the
            // public cascade contract of generated and injected class names.
            this.ensureRuntimeStyleOrder()
            this.styleTag.innerText = this.getStyles()
        }
    }

    addTheme = (theme: string, values: Record<string, any>) => {
        let themeVars = ''

        const convertToCSS = (key: string, value: any, prev = '-') => {
            if (typeof value === 'object' && value !== null) {
                Object.entries(value).forEach(([nestedKey, nestedValue]) =>
                    convertToCSS(nestedKey, nestedValue, `${prev}-${key}`),
                )
            }

            if (typeof value === 'string') {
                themeVars += `${prev}-${hyphenate(key)}:${value};`
            }
        }

        Object.entries(values).forEach(([key, value]) => convertToCSS(key, value))

        if (theme === 'light' || theme === 'dark') {
            this.themesCSS.set(`media ${theme}`, `@media (prefers-color-scheme: ${theme}){:root{${themeVars}}}`)
        }

        this.themesCSS.set(theme, `:root.${theme}{${themeVars}}`)
    }

    remove = (hash: string) => {
        this.removeSourceHash(hash)
        this.recreate()
    }

    getStyles = () => {
        let styles = Array.from(this.themesCSS.entries()).reduce((acc, [, themeCss]) => {
            return acc + themeCss
        }, '')

        return styles + this.getRuleStyles()
    }

    getStylesForHashes = (hashes: Iterable<string>) => {
        return this.serverStyleResources?.getStyles(this.resolveSourceHashes(hashes)) ?? ''
    }

    getStylesheetResourcesForHashes = (hashes: Iterable<string>) => {
        return this.getStylesheetResources(this.resolveSourceHashes(hashes))
    }

    getStylesheetResources = (sourceHashes: Iterable<string>): Array<StylesheetResource> =>
        this.serverStyleResources?.getStylesheetResources(sourceHashes) ?? []

    private getRuleStyles = (
        { mainMap, mqMap }: { mainMap: MapType; mqMap: MapType } = this,
        getSelector: (className: string) => string = this.getRegularSelector,
    ) => {
        let styles = ''

        const generate = (mediaQuery: string, secondLevelMap: Map<string, Map<string, string>>) => {
            let rules = ''

            for (const [className, thirdLevelMap] of secondLevelMap) {
                rules += `${getSelector(className)}{`

                for (const [propertyKey, value] of thirdLevelMap) {
                    if (value === undefined) {
                        continue
                    }

                    rules += `${hyphenate(propertyKey)}:${value};`
                }

                rules += '}'
            }

            if (!rules) {
                return
            }

            styles += mediaQuery ? `${mediaQuery}{${rules}}` : rules
        }

        for (const [mediaQuery, secondLevelMap] of mainMap) {
            generate(mediaQuery, secondLevelMap)
        }

        for (const [mediaQuery, secondLevelMap] of mqMap) {
            generate(mediaQuery, secondLevelMap)
        }

        return styles
    }

    private getRegularSelector = (className: string) => `.${className}`

    private ensureRuntimeStyleOrder = () => {
        if (!this.styleTag) {
            return
        }

        const resourceSelector = [
            `style[data-precedence="${UNISTYLES_PRECEDENCE}"]`,
            `link[data-precedence="${UNISTYLES_PRECEDENCE}"]`,
        ].join(',')
        const existingAnchor = document.getElementById(UNISTYLES_RESOURCE_ANCHOR_ID)
        const anchor = (existingAnchor ?? document.createElement('style')) as HTMLStyleElement
        const resources = Array.from(document.head.querySelectorAll(resourceSelector)).filter(
            (resource) => resource !== anchor,
        )
        const lastResource = resources[resources.length - 1]

        anchor.id = UNISTYLES_RESOURCE_ANCHOR_ID
        anchor.setAttribute('data-precedence', UNISTYLES_PRECEDENCE)

        if (lastResource) {
            if (lastResource.nextSibling !== anchor) {
                document.head.insertBefore(anchor, lastResource.nextSibling)
            }
        } else if (anchor.nextSibling !== this.styleTag) {
            document.head.insertBefore(anchor, this.styleTag)
        }

        if (!(anchor.compareDocumentPosition(this.styleTag) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            document.head.insertBefore(this.styleTag, anchor.nextSibling)
        }
    }

    private resolveSourceHashes = (hashes: Iterable<string>) => {
        const sourceHashes = new Set<string>()

        for (const hash of hashes) {
            if (hash.endsWith(CHILD_SELECTOR)) {
                sourceHashes.add(hash)
                continue
            }

            const registeredSources = this.sourceHashes.get(getLookupHash(hash))

            if (!registeredSources) {
                sourceHashes.add(hash)
                continue
            }

            registeredSources.forEach((sourceHash) => sourceHashes.add(sourceHash))
        }

        return Array.from(sourceHashes)
    }

    private removeSourceHash = (sourceHash: string) => {
        const lookupHash = getLookupHash(sourceHash)
        const locations = this.ruleLocations.get(sourceHash)

        locations?.forEach(({ className, isMq, mediaQuery }) => {
            this.removeRule(isMq ? this.mqMap : this.mainMap, mediaQuery, className)
        })

        const sources = this.sourceHashes.get(lookupHash)

        sources?.delete(sourceHash)
        this.ruleLocations.delete(sourceHash)
        this.serverStyleResources?.remove(sourceHash)
        if (!sources || sources.size === 0) {
            this.sourceHashes.delete(lookupHash)
        }
    }

    private removeRule = (map: MapType, mediaQuery: string, className: string) => {
        const classNames = map.get(mediaQuery)

        classNames?.delete(className)

        if (classNames?.size === 0) {
            map.delete(mediaQuery)
        }
    }

    getState = () => {
        const getState = (map: MapType) => {
            return Array.from(map).map(([mediaQuery, classNames]) => {
                return [
                    mediaQuery,
                    Array.from(classNames.entries()).map(([className, style]) => {
                        return [
                            className,
                            Array.from(style.entries()).map(([property, value]) => {
                                return [property, value]
                            }),
                        ]
                    }),
                ]
            }) as HydrateState
        }

        const mainState = getState(this.mainMap)
        const mqState = getState(this.mqMap)
        const config = this.services.state.getConfig()

        return { mainState, mqState, config }
    }

    hydrate = ({ mainState, mqState }: ReturnType<typeof this.getState>) => {
        const hydrateState = (map: HydrateState, isMq = false) => {
            map.forEach(([mediaQuery, classNames]) => {
                classNames.forEach(([className, style]) => {
                    style.forEach(([propertyKey, value]) => {
                        this.set({
                            className,
                            propertyKey,
                            value,
                            mediaQuery,
                            isMq,
                        })
                    })
                })
            })
        }

        hydrateState(mainState)
        hydrateState(mqState, true)
    }

    reset = () => {
        this.mqMap.clear()
        this.mainMap.clear()
        this.ruleLocations.clear()
        this.sourceHashes.clear()
        this.serverStyleResources?.reset()
    }
}
