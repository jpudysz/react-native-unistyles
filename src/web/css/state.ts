import type { UnistylesValues } from '../../types'
import { convertUnistyles } from '../convert'
import { hyphenate, isServer } from '../utils'
import { convertToCSS } from './core'

type MapType = Map<string, Map<string, Map<string, any>>>
type SetthisProps = {
    mediaQuery?: string
    className: string
    isMq?: boolean
    propertyKey: string
    value: any
}

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

    constructor() {
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
    }

    set = ({ className, propertyKey, value, mediaQuery = '', isMq }: SetthisProps) => {
        const firstLevelMap = isMq ? this.mqMap : this.mainMap
        const secondLevelMap = safeGetMap(firstLevelMap, mediaQuery)
        const thirdLevelMap = safeGetMap(secondLevelMap, className)

        thirdLevelMap.set(propertyKey, value)
    }

    add = (hash: string, values: UnistylesValues) => {
        convertToCSS(hash, convertUnistyles(values), this)

        if (this.styleTag) {
            this.styleTag.innerText = this.getStyles()
        }
    }

    remove = (hash: string) => {
        this.mainMap.forEach(styles => {
            styles.delete(hash)
        })

        if (this.styleTag) {
            this.styleTag.innerText = this.getStyles()
        }
    }

    getStyles = () => {
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

        for (const [mediaQuery, secondLevelMap] of this.mainMap) {
            generate(mediaQuery, secondLevelMap)
        }

        for (const [mediaQuery, secondLevelMap] of this.mqMap) {
            generate(mediaQuery, secondLevelMap)
        }

        return styles
    }

    getState = () => {
        return Array.from(this.mainMap.entries()).map(([mediaQuery, classNames]) => {
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
        }) as Array<[ string, Array<[ string, Array<[ string, any ]> ]> ]>
    }

    hydrate = (state: ReturnType<typeof this.getState>) => {
        state.forEach(([mediaQuery, classNames]) => {
            classNames.forEach(([className, style]) => {
                style.forEach(([propertyKey, value]) => {
                    this.set({
                        className,
                        propertyKey,
                        value,
                        mediaQuery
                    })
                })
            })
        })
    }

    reset = () => {
        this.mqMap.clear()
        this.mainMap.clear()
    }
}
