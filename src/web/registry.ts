import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesRuntime } from './runtime'
import { generateHash, extractUnistyleDependencies, error, isServer } from './utils'
import { UnistylesListener } from './listener'
import type { UnistylesMiniRuntime, UnistyleDependency } from '../specs'
import { CSSState } from './css'

class UnistylesRegistryBuilder {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCache = new Set<string>()
    private readonly stylesCounter = new Map<string, Set<HTMLElement>>()
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()
    readonly css = new CSSState()

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

    connect = (ref: HTMLElement, hash: string) => {
        const stylesCounter = this.stylesCounter.get(hash) ?? new Set()

        stylesCounter.add(ref)
        this.stylesCounter.set(hash, stylesCounter)
    }

    remove = (ref: HTMLElement, hash: string) => {
        const stylesCounter = this.stylesCounter.get(hash) ?? new Set()

        stylesCounter.delete(ref)

        if (stylesCounter.size === 0 && !document.querySelector(hash)) {
            this.css.remove(hash)
            this.stylesCache.delete(hash)
        }
    }

    add = (value: UnistylesValues) => {
        const hash = generateHash(value)

        if (!this.stylesCache.has(hash)) {
            this.applyStyles(hash, value)
            this.stylesCache.add(hash)

            return { hash, existingHash: false }
        }

        return { hash, existingHash: true }
    }

    applyStyles = (hash: string, value: UnistylesValues) => {
        this.css.add(hash, value)
    }
}

declare global {
    var __unistyles__: UnistylesRegistryBuilder
}

if (isServer() && !globalThis.__unistyles__) {
    globalThis.__unistyles__ = new UnistylesRegistryBuilder()
}

export const UnistylesRegistry = isServer() ? globalThis.__unistyles__ : new UnistylesRegistryBuilder()
