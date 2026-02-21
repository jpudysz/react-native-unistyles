import type { UnistyleDependency, UnistylesMiniRuntime } from '../specs'
import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { CSSState } from './css'
import type { UnistylesServices } from './types'
import { error, extractUnistyleDependencies, generateHash } from './utils'

export class UnistylesRegistry {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCache = new Set<string>()
    private readonly stylesCounter = new Map<string, Set<HTMLElement>>()
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()
    readonly css: CSSState

    constructor(private services: UnistylesServices) {
        this.css = new CSSState(services)
    }

    getComputedStylesheet = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, scopedThemeName?: UnistylesTheme) => {
        if (typeof stylesheet !== 'function') {
            return stylesheet
        }

        if (scopedThemeName) {
            const scopedTheme = this.services.runtime.getTheme(scopedThemeName)

            if (!scopedTheme) {
                throw error(`Unistyles: You're trying to use scoped theme '${scopedThemeName}' but it wasn't registered.`)
            }

            return stylesheet(scopedTheme, this.services.runtime.miniRuntime)
        }

        const computedStylesheet = this.stylesheets.get(stylesheet)

        if (computedStylesheet) {
            return computedStylesheet
        }

        const currentTheme = this.services.runtime.getTheme(this.services.runtime.themeName, this.services.state.CSSVars)
        const createdStylesheet = stylesheet(currentTheme, this.services.runtime.miniRuntime)
        const dependencies = Object.values(createdStylesheet).flatMap(value => extractUnistyleDependencies(value))

        this.addDependenciesToStylesheet(stylesheet, dependencies)
        this.stylesheets.set(stylesheet, createdStylesheet)

        return createdStylesheet
    }

    addDependenciesToStylesheet = (stylesheet: (theme: UnistylesTheme, miniRuntime: UnistylesMiniRuntime) => StyleSheet, dependencies: Array<UnistyleDependency>) => {
        this.disposeListenersMap.get(stylesheet)?.()

        const dependenciesMap = this.dependenciesMap.get(stylesheet) ?? new Set(dependencies)

        dependencies.forEach(dependency => dependenciesMap.add(dependency))

        const dispose = this.services.listener.addStylesheetListeners(Array.from(dependenciesMap), () => {
            const newComputedStylesheet = stylesheet(
                this.services.runtime.getTheme(this.services.runtime.themeName, this.services.state.CSSVars),
                this.services.runtime.miniRuntime
            )

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

        if (stylesCounter.size === 0) {
            // Move this to the end of the event loop so the element is removed from the DOM
            return Promise.resolve().then(() => {
                // Check if element is still in the DOM
                if (document.querySelector(`.${hash}`)) {
                    return false
                }

                this.css.remove(hash)
                this.stylesCache.delete(hash)

                return true
            })
        }

        return Promise.resolve(false)
    }

    add = (value: UnistylesValues, forChild?: boolean, containerName?: string) => {
        const generatedHash = generateHash(value)
        const baseHash = forChild
            ? `${generatedHash} > *`
            : generatedHash
        const cacheKey = containerName
            ? `${baseHash}__cq__${containerName}`
            : baseHash

        if (!this.stylesCache.has(cacheKey)) {
            this.applyStyles(baseHash, value, containerName)
            this.stylesCache.add(cacheKey)

            return { hash: baseHash, existingHash: false }
        }

        return { hash: baseHash, existingHash: true }
    }

    applyStyles = (hash: string, value: UnistylesValues, containerName?: string) => {
        this.css.add(hash, value, containerName)
    }

    reset = () => {
        this.css.reset()
        this.stylesCache.clear()
        this.dependenciesMap.clear()
        this.disposeListenersMap.clear()
        this.stylesCounter.clear()
    }
}
