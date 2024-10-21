import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesRuntime } from './runtime'
import { extractMediaQueryValue, keyInObject, getMediaQuery, generateHash, extractUnistyleDependencies } from './utils'
import { UnistylesListener } from './listener'
import { convertUnistyles } from './convert'
import type { UnistyleDependency } from '../specs/NativePlatform'
import type { UnistylesMiniRuntime } from '../specs'
import { getVariants } from './variants'

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
    #styleTag: HTMLStyleElement | null = null
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()

    private get styleTag() {
        const tag = this.#styleTag

        if (!tag) {
            const newTag = document.createElement('style')

            newTag.id = 'unistyles-web'
            this.#styleTag = newTag
            document.head.appendChild(newTag)

            return newTag
        }

        return tag
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
        const dependencies = Object.values(createdStylesheet).flatMap(value => extractUnistyleDependencies(value))

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

        this.dependenciesMap.set(stylesheet, dependenciesMap)
        this.disposeListenersMap.set(stylesheet, dispose)
    }

    add = ({ key, value, stylesheet, args, variants }: AddProps) => {
        const hash = generateHash(value)
        const existingCounter = this.stylesCounter.get(hash)

        if (!existingCounter || existingCounter.size === 0) {
            const counter = new Set<UnistylesValues>()
            const dependencies = extractUnistyleDependencies(value)

            counter.add(value)
            this.stylesCounter.set(hash, counter)
            this.applyStyles(hash, convertUnistyles(value))

            UnistylesListener.addListeners(dependencies, async () => {
                // Move this callback to the end of the event loop
                await Promise.resolve()

                const newComputedStyleSheet = this.getComputedStylesheet(stylesheet)
                const newValue = newComputedStyleSheet[key]!
                const result = typeof newValue === 'function'
                    ? newValue(...args)
                    : newValue
                const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
                const resultWithVariants = {
                    ...result,
                    ...variantsResult
                }

                this.applyStyles(hash, convertUnistyles(resultWithVariants))
            })

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
                const cssRules = Array.from(this.styleTag.sheet.cssRules)
                let queryRule = cssRules.find(rule => {
                    if (!(rule instanceof CSSMediaRule)) {
                        return false
                    }

                    return rule.media.item(0)?.includes(mediaQuery)
                }) ?? null

                if (!queryRule) {
                    const mediaQueryValue = extractMediaQueryValue(mediaQuery)
                    const ruleIndex = mediaQueryValue
                        ? cssRules.reduce<number | undefined>((acc, rule, ruleIndex) => {
                            if (!(rule instanceof CSSMediaRule)) {
                                return acc
                            }

                            const ruleMediaQueryValue = extractMediaQueryValue(rule.conditionText)

                            if (ruleMediaQueryValue === undefined) {
                                return
                            }

                            return ruleMediaQueryValue > mediaQueryValue ? ruleIndex : acc
                        }, cssRules.length)
                        : undefined
                    queryRule = this.styleTag.sheet.cssRules.item(this.styleTag.sheet.insertRule(`@media ${mediaQuery} {.${hash} {}}`, ruleIndex))
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

                return
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
        let rule = Array.from(sheet.cssRules).find(rule => {
            if (!(rule instanceof CSSStyleRule)) {
                return false
            }

            // In unistyles pseudos are prefixed with ':' but in css some of them are prefixed with '::'
            return rule.selectorText.replace('::', ':').includes(hash)
        }) ?? null

        if (!rule) {
            rule = sheet.cssRules.item(sheet.insertRule(`.${hash} {}`))
        }

        if (!(rule instanceof CSSStyleRule) || !keyInObject(rule.style, key)) {
            return
        }

        rule.style[key as RemoveReadonlyStyleKeys<typeof key>] = value

        if (key === 'content') {
            rule.style.setProperty('content', value)
        }
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
