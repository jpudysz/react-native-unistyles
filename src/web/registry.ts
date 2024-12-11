import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesRuntime } from './runtime'
import { generateHash, extractUnistyleDependencies, error, isServer } from './utils'
import { UnistylesListener } from './listener'
import type { UnistylesMiniRuntime, UnistyleDependency } from '../specs'
import { CSSState } from './css'

class UnistylesRegistryBuilder {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCounter = new Map<string, number>()
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()
    readonly css = new CSSState()
    private styleTag: HTMLStyleElement | null = null

    constructor() {
        if (isServer()) {
            return
        }

        this.styleTag = document.createElement('style')
        this.styleTag.id = 'unistyles-web'
        document.head.appendChild(this.styleTag)
    }

    getComputedStylesheet = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, scopedThemeName?: UnistylesTheme) => {
        if (typeof stylesheet !== 'function') {
            return stylesheet
        }

        if (scopedThemeName) {
            const scopedTheme = UnistylesRuntime.getTheme(scopedThemeName)

            if (!scopedTheme) {
                throw error(`Unistyles: You're trying to use scoped theme '${scopedThemeName}' but it wasn't registered.`)
            }

            return stylesheet(scopedTheme, UnistylesRuntime.miniRuntime)
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

        const dispose = UnistylesListener.addStylesheetListeners(Array.from(dependenciesMap), () => {
            const newComputedStylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)

            this.stylesheets.set(stylesheet, newComputedStylesheet)
        })

        this.dependenciesMap.set(stylesheet, dependenciesMap)
        this.disposeListenersMap.set(stylesheet, dispose)
    }

    add = (value: UnistylesValues) => {
        const hash = generateHash(value)
        const existingCounter = this.stylesCounter.get(hash)

        if (existingCounter === undefined) {
            this.applyStyles(hash, value)
            this.stylesCounter.set(hash, 1)

            return { hash, existingHash: false }
        }

        this.stylesCounter.set(hash, existingCounter + 1)

        return { hash, existingHash: true }
    }

    remove = (hash: string) => {
        hash
    }

    applyStyles = (hash: string, value: UnistylesValues) => {
        this.css.add(hash, value)

        if (this.styleTag) {
            this.styleTag.innerHTML = this.css.getStyles()
        }
    }
}

declare global {
    var __unistyles__: UnistylesRegistryBuilder
}

if (isServer() && !globalThis.__unistyles__) {
    globalThis.__unistyles__ = new UnistylesRegistryBuilder()
}

export const UnistylesRegistry = isServer() ? globalThis.__unistyles__ : new UnistylesRegistryBuilder()
