import type { UnistylesValues } from '../../types'
import type { UnistylesServices } from '../types'

import { convertUnistyles } from '../convert'
import { hyphenate } from '../utils'
import { convertToCSS, getChildrenClassName } from './core'
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
    // Every class name a hash produced, pseudo and children selectors included, so re-applying or removing it is exact
    private owners = new Map<string, ClassNames>()
    private sheet = new CSSSheet(this.themesCSS, this.mainMap)

    constructor(private services: UnistylesServices) {}

    set = ({ className, propertyKey, value, mediaQuery = '' }: SetProps) => {
        const secondLevelMap = safeGetMap(this.mainMap, mediaQuery)
        const thirdLevelMap = safeGetMap(secondLevelMap, className)

        thirdLevelMap.set(propertyKey, value)
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
        const classNames: ClassNames = new Map(
            Array.from(styles, ([mediaQuery, classes]) => [mediaQuery, new Set(classes.keys())]),
        )

        // Re-applying a hash replaces its styles, so a property or selector it doesn't produce anymore doesn't linger.
        // Clearing keeps each class in place: its rule is edited where it is, and the cascade order doesn't change
        forEachClassName(previousClassNames, (mediaQuery, className) => {
            this.mainMap.get(mediaQuery)?.get(className)?.clear()
        })
        styles.forEach((classes, mediaQuery) => {
            classes.forEach((properties, className) => {
                properties.forEach((value, propertyKey) => this.set({ mediaQuery, className, propertyKey, value }))
            })
        })
        this.owners.set(hash, classNames)
        forEachClassName(previousClassNames, (mediaQuery, className) => {
            if (!classNames.get(mediaQuery)?.has(className)) {
                this.mainMap.get(mediaQuery)?.delete(className)
                this.sheet.syncClass(mediaQuery, className)
            }
        })
        forEachClassName(classNames, this.sheet.syncClass)
        this.sheet.refresh()
    }

    recreate = () => {
        this.sheet.rebuild()
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
            this.themesCSS.set(
                `media ${theme}`,
                `@media (prefers-color-scheme: ${theme}){:root,[data-unistyles-reset]{${themeVars}}}`,
            )
            this.sheet.syncTheme(`media ${theme}`)
        }

        this.themesCSS.set(
            theme,
            `:root.${theme},:root.${theme} [data-unistyles-reset],[data-unistyles-theme="${theme}"]{${themeVars}}`,
        )
        this.sheet.syncTheme(theme)
    }

    remove = (hash: string) => {
        const ownClassNames = this.owners.get(hash)
        const childrenClassName = getChildrenClassName(hash)

        this.owners.delete(hash)
        this.mainMap.forEach((styles, mediaQuery) => {
            const classNames = new Set(ownClassNames?.get(mediaQuery)).add(hash).add(childrenClassName)

            classNames.forEach((className) => {
                if (styles.delete(className)) {
                    this.sheet.syncClass(mediaQuery, className)
                }
            })
        })
        this.sheet.refresh()
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
        // Media query styles live in mainState with the rest, the field stays for clients that read it
        const mqState: HydrateState = []
        const config = this.services.state.getConfig()

        return { mainState, mqState, config }
    }

    hydrate = ({ mainState, mqState }: ReturnType<typeof this.getState>) => {
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

        hydrateState(mainState)
        // A server that sent media query styles apart still gets them into the same groups
        hydrateState(mqState)
    }

    reset = () => {
        this.mainMap.clear()
        this.mainMap.set('', new Map())
        this.owners.clear()
        this.sheet.reset()
    }
}
