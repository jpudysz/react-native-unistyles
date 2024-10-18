import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesRuntime } from './runtime'
import { isServer, keyInObject } from './utils'
import { UnistylesListener } from './listener'
import { convertUnistyles } from './convert'
import type { UnistyleDependency } from '../specs/NativePlatform'
import type { UnistylesMiniRuntime } from '../specs'
import { getMediaQuery } from './mediaQuery'
import { getVariants } from './variants'

const generateHash = (value: any) => {
    const str = JSON.stringify(value)
    let hasher = 5381
    let length = str.length

    while (length--) hasher = (hasher * 33) ^ str.charCodeAt(length)

    return `unistyles-${(hasher >>> 0).toString(36)}`
}

type AddProps = {
    value: UnistylesValues,
    stylesheet: StyleSheetWithSuperPowers<StyleSheet>,
    key: string,
    args: Array<any>,
    variants: Record<string, any>
}

type ApplyRuleProps = {
    hash: string,
    key: string,
    value: any,
    sheet: CSSStyleSheet | CSSMediaRule
}

type RemoveReadonlyStyleKeys<T extends string> = T extends 'length' | 'parentRule' ? never : T

class UnistylesRegistryBuilder {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCounter = new Map<string, Set<UnistylesValues>>()
    private readonly styleTag = document.createElement('style')
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()

    constructor() {
        if (isServer()) {
            return
        }

        this.styleTag.id = 'unistyles-web'
        document.head.appendChild(this.styleTag)
    }

    getComputedStylesheet = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
        if (typeof stylesheet !== 'function') {
            return stylesheet
        }

        const computedStylesheet = this.stylesheets.get(stylesheet)

        if (computedStylesheet) {
            return computedStylesheet
        }

        const createdStylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        // @ts-expect-error uni__dependencies is hidden
        const dependencies = Object.values(createdStylesheet).flatMap(value => keyInObject(value, 'uni__dependencies') ? value.uni__dependencies : [])

        this.addDependenciesToStylesheet(stylesheet, dependencies)
        this.stylesheets.set(stylesheet, createdStylesheet)

        return createdStylesheet
    }

    addDependenciesToStylesheet = (stylesheet: (theme: UnistylesTheme, miniRuntime: UnistylesMiniRuntime) => StyleSheet, dependencies: Array<UnistyleDependency>) => {
        this.disposeListenersMap.get(stylesheet)?.()

        const dependenciesMap = this.dependenciesMap.get(stylesheet) ?? new Set(dependencies)

        dependencies.forEach(dependency => dependenciesMap.add(dependency))

        const dispose = UnistylesListener.addListeners(Array.from(dependenciesMap), () => {
            const newComputedStylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)

            this.stylesheets.set(stylesheet, newComputedStylesheet)
        })

        this.disposeListenersMap.set(stylesheet, dispose)
    }

    add = ({ key, value, stylesheet, args, variants }: AddProps) => {
        const hash = generateHash(value)
        const existingCounter = this.stylesCounter.get(hash)

        if (!existingCounter || existingCounter.size === 0) {
            const counter = new Set<UnistylesValues>()

            counter.add(value)
            this.stylesCounter.set(hash, counter)
            this.applyStyles(hash, convertUnistyles(value))

            // @ts-expect-error uni__dependencies is hidden
            const dependencies: Array<UnistyleDependency> = keyInObject(value, 'uni__dependencies') ? value.uni__dependencies : []

            UnistylesListener.addListeners(dependencies, () => Promise.resolve().then(() => {
                const newComputedStyleSheet = this.getComputedStylesheet(stylesheet)
                const newValue = newComputedStyleSheet[key]

                if (!newValue) {
                    return
                }

                const result = typeof newValue === 'function'
                    ? newValue(...args)
                    : newValue
                const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
                const resultWithVariants = {
                    ...result,
                    ...variantsResult
                }

                this.applyStyles(hash, convertUnistyles(resultWithVariants))
            }))

            return hash
        }

        existingCounter.add(value)

        return hash
    }

    private applyStyles = (hash: string, styles: Record<string, any>) => {
        Object.entries(styles).forEach(([key, value]) => {
            if (!this.styleTag.sheet) {
                return
            }

            if (typeof value === 'object' && !key.startsWith('_')) {
                const mediaQuery = getMediaQuery(key)
                let queryRule: CSSRule | null = Array.from(this.styleTag.sheet.cssRules).find(rule => {
                    if (!(rule instanceof CSSMediaRule)) {
                        return false
                    }

                    return rule.media.item(0)?.includes(mediaQuery)
                }) ?? null

                if (!queryRule) {
                    queryRule = this.styleTag.sheet.cssRules.item(this.styleTag.sheet.insertRule(`@media ${mediaQuery} {.${hash} {}}`))
                }

                if (queryRule instanceof CSSMediaRule) {
                    Object.entries(value).forEach(([mqKey, mqValue]) => {
                        this.applyRule({
                            hash,
                            key: mqKey,
                            value: mqValue,
                            sheet: queryRule
                        })
                    })
                }

                return
            }

            // Pseudo
            if (typeof value === 'object') {
                Object.entries(value).forEach(([pseudoKey, pseudoValue]) => {
                    this.applyRule({
                        hash: `${hash}${key.replace('_', ':')}`,
                        key: pseudoKey,
                        value: pseudoValue,
                        sheet: this.styleTag.sheet!
                    })
                })
            }

            this.applyRule({
                hash,
                key,
                value,
                sheet: this.styleTag.sheet
            })
        })
    }

    private applyRule = ({ hash, key, value, sheet }: ApplyRuleProps) => {
        let rule: CSSRule | null = Array.from(sheet.cssRules).find(rule => rule.cssText.includes(`.${hash}`)) ?? null

        if (!rule) {
            rule = sheet.cssRules.item(sheet.insertRule(`.${hash} {}`))
        }

        if (!(rule instanceof CSSStyleRule) || !keyInObject(rule.style, key)) {
            return
        }

        rule.style[key as RemoveReadonlyStyleKeys<typeof key>] = value
    }

    remove = (value: UnistylesValues) => {
        const hash = generateHash(value)
        const existingStyles = this.stylesCounter.get(hash)

        if (!existingStyles) {
            return
        }

        existingStyles.delete(value)

        if (existingStyles.size === 0) {
            const ruleIndex = Array.from(this.styleTag.sheet?.cssRules ?? []).findIndex(rule => rule.cssText.includes(`.${hash}`))

            this.styleTag.sheet?.deleteRule(ruleIndex)
        }
    }
}

export const UnistylesRegistry = new UnistylesRegistryBuilder()
