import type {
    CreateServerStyleResources,
    CSSMap,
    ServerStyleResourceSetProps,
    ServerStyleResources,
    StylesheetResource,
} from './serverStyleResources.types'

import { generateHash, hyphenate } from '../utils'

type IndexedRules = {
    mainMap: CSSMap
    mqMap: CSSMap
}

const safeGetMap = (map: Map<string, Map<string, any>>, key: string) => {
    const nextLevelMap = map.get(key)

    if (nextLevelMap) {
        return nextLevelMap
    }

    const newMap = new Map<string, any>()

    map.set(key, newMap)

    return newMap
}

const getRuleStyles = ({ mainMap, mqMap }: IndexedRules) => {
    let styles = ''

    const generate = (mediaQuery: string, secondLevelMap: Map<string, Map<string, string>>) => {
        let rules = ''

        for (const [className, thirdLevelMap] of secondLevelMap) {
            rules += `.${className}{`

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

const createIndexedRules = (): IndexedRules => ({
    mainMap: new Map(),
    mqMap: new Map(),
})

export const createServerStyleResources: CreateServerStyleResources = () => {
    const indexedRules = new Map<string, IndexedRules>()
    const stylesheetResources = new Map<string, StylesheetResource>()

    const set = ({ className, declarations, isMq, mediaQuery, sourceHash }: ServerStyleResourceSetProps) => {
        const rules = indexedRules.get(sourceHash) ?? createIndexedRules()
        const firstLevelMap = isMq ? rules.mqMap : rules.mainMap
        const secondLevelMap = safeGetMap(firstLevelMap, mediaQuery)

        secondLevelMap.set(className, declarations)
        indexedRules.set(sourceHash, rules)
        stylesheetResources.delete(sourceHash)
    }

    const getStylesheetResources: ServerStyleResources['getStylesheetResources'] = (sourceHashes) =>
        Array.from(new Set(sourceHashes)).flatMap((sourceHash): Array<StylesheetResource> => {
            const cachedResource = stylesheetResources.get(sourceHash)

            if (cachedResource) {
                return [cachedResource]
            }

            const rules = indexedRules.get(sourceHash)

            if (!rules) {
                return []
            }

            const css = getRuleStyles(rules)

            if (!css) {
                return []
            }

            const resource = {
                css,
                href: `unistyles:${generateHash(css)}`,
            } as const

            stylesheetResources.set(sourceHash, resource)

            return [resource]
        })

    return {
        getStyles: (sourceHashes) => {
            const rules = Array.from(new Set(sourceHashes))
                .map((sourceHash) => indexedRules.get(sourceHash))
                .filter((value): value is IndexedRules => Boolean(value))
            const emptyMap: CSSMap = new Map()
            const mainStyles = rules.map((value) => getRuleStyles({ mainMap: value.mainMap, mqMap: emptyMap })).join('')
            const mqStyles = rules.map((value) => getRuleStyles({ mainMap: emptyMap, mqMap: value.mqMap })).join('')

            return mainStyles + mqStyles
        },
        getStylesheetResources,
        remove: (sourceHash) => {
            indexedRules.delete(sourceHash)
            stylesheetResources.delete(sourceHash)
        },
        reset: () => {
            indexedRules.clear()
            stylesheetResources.clear()
        },
        set,
    }
}
