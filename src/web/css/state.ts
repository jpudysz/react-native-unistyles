import type { UnistylesValues } from '../../types'
import { convertUnistyles } from '../convert'
import type { UnistylesServices } from '../types'
import { hyphenate, isServer } from '../utils'
import { convertToCSS } from './core'

type MapType = Map<string, Map<string, Map<string, any>>>
type SetProps = {
    mediaQuery?: string
    className: string
    isMq?: boolean
    propertyKey: string
    value: any
}
type HydrateState = Array<[ string, Array<[ string, Array<[ string, any ]> ]> ]>

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

    constructor(private services: UnistylesServices) {
        if (isServer()) {
            return
        }

        const ssrTag = document.getElementById('unistyles-web')

        if (ssrTag) {
            this.styleTag = ssrTag as HTMLStyleElement

            return
        }

        this.styleTag = document.createElement('style')
        this.styleTag.id = 'unistyles-web'
        document.head.appendChild(this.styleTag)
    }

    set = ({ className, propertyKey, value, mediaQuery = '', isMq }: SetProps) => {
        const firstLevelMap = isMq ? this.mqMap : this.mainMap
        const secondLevelMap = safeGetMap(firstLevelMap, mediaQuery)
        const thirdLevelMap = safeGetMap(secondLevelMap, className)

        thirdLevelMap.set(propertyKey, value)
    }

    add = (hash: string, values: UnistylesValues, containerName?: string) => {
        convertToCSS(hash, convertUnistyles(values, this.services.runtime), this, containerName)
        this.recreate()
    }

    recreate = () => {
        if (this.styleTag) {
            this.styleTag.innerText = this.getStyles()
        }
    }

    addTheme = (theme: string, values: Record<string, any>) => {
        let themeVars = ''

        const convertToCSS = (key: string, value: any, prev = '-') => {
            if (typeof value === 'object' && value !== null) {
                Object.entries(value).forEach(([nestedKey, nestedValue]) => convertToCSS(nestedKey, nestedValue, `${prev}-${key}`))
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
        this.mainMap.forEach(styles => {
            styles.delete(hash)
        })
        this.mqMap.forEach(styles => {
            styles.delete(hash)
        })
        this.recreate()
    }

    getStyles = () => {
        let styles = Array.from(this.themesCSS.entries()).reduce((acc, [, themeCss]) => {
            return acc + themeCss
        }, '')

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

        for (const [mediaQuery, secondLevelMap] of this.mainMap) {
            generate(mediaQuery, secondLevelMap)
        }

        for (const [mediaQuery, secondLevelMap] of this.mqMap) {
            generate(mediaQuery, secondLevelMap)
        }

        return styles
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
                            })
                        ]
                    })
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
                            isMq
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
    }
}
