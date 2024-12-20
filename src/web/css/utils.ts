import { hyphenate } from '../utils'
import type { CSSState } from './state'

export const safeGetMap = (map: Map<string, Map<string, any>>, key: string) => {
    const nextLevelMap = map.get(key)

    if (!nextLevelMap) {
        const newMap = new Map<string, any>()

        map.set(key, newMap)

        return newMap
    }

    return nextLevelMap
}

export const getStylesFromState = (state: CSSState) => {
    let styles = ''

    const generate = (mediaQuery: string, secondLevelMap: Map<string, Map<string, string>>) => {
        if (mediaQuery) {
            styles += `${mediaQuery}{`
        }

        for (const [className, thirdLevelMap] of secondLevelMap) {
            styles += `.${className}{`

            for (const [propertyKey, value] of thirdLevelMap) {
                if (value === undefined) {
                    continue
                }

                styles += `${hyphenate(propertyKey)}:${value};`
            }

            styles += '}'
        }

        if (mediaQuery) {
            styles += '}'
        }
    }

    for (const [mediaQuery, secondLevelMap] of state.mainMap) {
        generate(mediaQuery, secondLevelMap)
    }

    for (const [mediaQuery, secondLevelMap] of state.mqMap) {
        generate(mediaQuery, secondLevelMap)
    }

    return styles
}
