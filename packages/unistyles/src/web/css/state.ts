import type { UnistylesValues } from '../../types'
import type { UnistylesServices } from '../types'

import { convertUnistyles } from '../convert'
import { hyphenate } from '../utils'
import { convertToCSS, getClassNameHash } from './core'
import { CSSSheet, getDeclarations, getSelector } from './sheet'
import { safeGetMap } from './utils'

type MapType = Map<string, Map<string, Map<string, any>>>
type ClassNames = Map<string, Set<string>>
type SetProps = {
    mediaQuery?: string
    className: string
    propertyKey: string
    value: any
}
type HydrateState = Array<[string, Array<[string, Array<[string, any]>]>]>

const forEachClassName = (
    classNames: ClassNames | undefined,
    callback: (mediaQuery: string, className: string) => void,
) => {
    classNames?.forEach((names, mediaQuery) => names.forEach((className) => callback(mediaQuery, className)))
}

export class CSSState {
    // The base group goes first, so a media query always overrides it at the same specificity
    mainMap: MapType = new Map([['', new Map()]])
    private themesCSS = new Map<string, string>()
    // Every class name each hash produced, pseudo and children selectors included
    private owners = new Map<string, ClassNames>()
    private hydratedState?: ReturnType<CSSState['getState']>
    private sheet = new CSSSheet(this.themesCSS, this.mainMap)

    constructor(private services: UnistylesServices) {}

    set = ({ className, propertyKey, value, mediaQuery = '' }: SetProps) => {
        const secondLevelMap = safeGetMap(this.mainMap, mediaQuery)
        const thirdLevelMap = safeGetMap(secondLevelMap, className)

        thirdLevelMap.set(propertyKey, value)

        // The owner comes from the class name, so hydrated styles have one too
        const owner: ClassNames = safeGetMap(this.owners, getClassNameHash(className))
        const classNames = owner.get(mediaQuery) ?? new Set()

        classNames.add(className)
        owner.set(mediaQuery, classNames)
    }

    add = (hash: string, values: UnistylesValues) => {
        // Converted apart first, so a style that fails to convert keeps its previous declarations
        const styles: MapType = new Map()

        convertToCSS(hash, convertUnistyles(values, this.services.runtime), {
            set: ({ className, propertyKey, value, mediaQuery = '' }) => {
                safeGetMap(safeGetMap(styles, mediaQuery), className).set(propertyKey, value)
            },
        })

        const previousClassNames = this.owners.get(hash)

        // Cleared in place, so each rule is edited where it is and the cascade order doesn't change
        forEachClassName(previousClassNames, (mediaQuery, className) => {
            this.mainMap.get(mediaQuery)?.get(className)?.clear()
        })
        this.owners.delete(hash)
        styles.forEach((classes, mediaQuery) => {
            classes.forEach((properties, className) => {
                properties.forEach((value, propertyKey) => this.set({ mediaQuery, className, propertyKey, value }))
            })
        })

        const classNames = this.owners.get(hash)

        forEachClassName(previousClassNames, (mediaQuery, className) => {
            if (!classNames?.get(mediaQuery)?.has(className)) {
                this.mainMap.get(mediaQuery)?.delete(className)
                this.sheet.syncClass(mediaQuery, className)
            }
        })
        forEachClassName(classNames, this.sheet.syncClass)

        // syncClass already brings back the rules the tag lost, refresh does it when nothing was synced
        if (!previousClassNames && !classNames) {
            this.sheet.refresh()
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

        // ScopedTheme renders an element with data-unistyles-theme (or data-unistyles-reset for `reset`),
        // so the variables follow the closest scope and styles don't need to know it while they render
        if (theme === 'light' || theme === 'dark') {
            this.setThemeCSS(
                `media ${theme}`,
                `@media (prefers-color-scheme: ${theme}){:root,[data-unistyles-reset]{${themeVars}}}`,
            )
        }

        this.setThemeCSS(
            theme,
            `:root.${theme},:root.${theme} [data-unistyles-reset],[data-unistyles-theme="${theme}"]{${themeVars}}`,
        )
    }

    // themesCSS keeps the last theme the browser accepted, so a new sheet gets the variables that apply now
    private setThemeCSS = (key: string, css: string) => {
        if (this.sheet.syncTheme(key, css)) {
            this.themesCSS.set(key, css)
        }
    }

    remove = (hash: string) => {
        const classNames = this.owners.get(hash)

        this.owners.delete(hash)
        forEachClassName(classNames, (mediaQuery, className) => {
            this.mainMap.get(mediaQuery)?.delete(className)
            this.sheet.syncClass(mediaQuery, className)
        })

        if (!classNames) {
            this.sheet.refresh()
        }
    }

    getStyles = () => {
        let styles = Array.from(this.themesCSS.entries()).reduce((acc, [, themeCss]) => {
            return acc + themeCss
        }, '')

        for (const [mediaQuery, secondLevelMap] of this.mainMap) {
            if (mediaQuery) {
                styles += `${mediaQuery}{`
            }

            for (const [className, thirdLevelMap] of secondLevelMap) {
                styles += `${getSelector(className)}{${getDeclarations(thirdLevelMap)}}`
            }

            if (mediaQuery) {
                styles += '}'
            }
        }

        return styles
    }

    getState = () => {
        const mainState = Array.from(this.mainMap).map(([mediaQuery, classNames]) => {
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
        // Always empty, media query styles live in mainState. Kept for compatibility, drop it in 4.0
        const mqState: HydrateState = []
        const config = this.services.state.getConfig()

        return { mainState, mqState, config }
    }

    hydrate = (state: ReturnType<typeof this.getState>) => {
        // useServerUnistyles hydrates the same state on every render, a second run would undo later changes
        if (state === this.hydratedState) {
            return
        }

        this.hydratedState = state

        const hydrateState = (map: HydrateState) => {
            map.forEach(([mediaQuery, classNames]) => {
                classNames.forEach(([className, style]) => {
                    style.forEach(([propertyKey, value]) => {
                        this.set({
                            className,
                            propertyKey,
                            value,
                            mediaQuery,
                        })
                    })
                    this.sheet.syncClass(mediaQuery, className)
                })
            })
        }

        hydrateState(state.mainState)
        // An older server sends media query styles apart
        hydrateState(state.mqState)
    }

    reset = () => {
        this.mainMap.clear()
        this.mainMap.set('', new Map())
        this.owners.clear()
        this.hydratedState = undefined
        this.sheet.reset()
    }
}
