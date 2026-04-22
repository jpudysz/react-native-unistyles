import type { UnistyleDependency, UnistylesMiniRuntime } from '../specs'
import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import type { UnistylesServices } from './types'

import { CSSState } from './css'
import { error, extractUnistyleDependencies, generateHash } from './utils'

export class UnistylesRegistry {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCache = new Set<string>()
    // Use counter instead of Set<HTMLElement> to avoid retaining detached DOM nodes
    // FR is a fallback when remove() is missed
    private readonly stylesCounter = new Map<string, number>()
    private readonly finalizationRegistry = new FinalizationRegistry<string>((hash) => {
        this.decrementAndMaybeCleanup(hash)
    })
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
                throw error(
                    `Unistyles: You're trying to use scoped theme '${scopedThemeName}' but it wasn't registered.`,
                )
            }

            return stylesheet(scopedTheme, this.services.runtime.miniRuntime)
        }

        const computedStylesheet = this.stylesheets.get(stylesheet)

        if (computedStylesheet) {
            return computedStylesheet
        }

        const currentTheme = this.services.runtime.getTheme(
            this.services.runtime.themeName,
            this.services.state.CSSVars,
        )
        const createdStylesheet = stylesheet(currentTheme, this.services.runtime.miniRuntime)
        const dependencies = Object.values(createdStylesheet).flatMap((value) => extractUnistyleDependencies(value))

        this.addDependenciesToStylesheet(stylesheet, dependencies)
        this.stylesheets.set(stylesheet, createdStylesheet)

        return createdStylesheet
    }

    addDependenciesToStylesheet = (
        stylesheet: (theme: UnistylesTheme, miniRuntime: UnistylesMiniRuntime) => StyleSheet,
        dependencies: Array<UnistyleDependency>,
    ) => {
        this.disposeListenersMap.get(stylesheet)?.()

        const dependenciesMap = this.dependenciesMap.get(stylesheet) ?? new Set(dependencies)

        dependencies.forEach((dependency) => dependenciesMap.add(dependency))

        const dispose = this.services.listener.addStylesheetListeners(Array.from(dependenciesMap), () => {
            const newComputedStylesheet = stylesheet(
                this.services.runtime.getTheme(this.services.runtime.themeName, this.services.state.CSSVars),
                this.services.runtime.miniRuntime,
            )

            this.stylesheets.set(stylesheet, newComputedStylesheet)
        })

        this.dependenciesMap.set(stylesheet, dependenciesMap)
        this.disposeListenersMap.set(stylesheet, dispose)
    }

    connect = (ref: HTMLElement, hash: string) => {
        this.stylesCounter.set(hash, (this.stylesCounter.get(hash) ?? 0) + 1)
        this.finalizationRegistry.register(ref, hash, ref)
    }

    remove = (ref: HTMLElement, hash: string) => {
        this.finalizationRegistry.unregister(ref)

        return this.decrementAndMaybeCleanup(hash)
    }

    private decrementAndMaybeCleanup = (hash: string): Promise<boolean> => {
        const next = (this.stylesCounter.get(hash) ?? 0) - 1

        if (next > 0) {
            this.stylesCounter.set(hash, next)

            return Promise.resolve(false)
        }

        // Drop the empty bucket from the Map
        this.stylesCounter.delete(hash)

        // Move this to the end of the event loop so the element is removed from the DOM
        return Promise.resolve().then(() => {
            // New connect raced in during the microtask
            if ((this.stylesCounter.get(hash) ?? 0) > 0) {
                return false
            }

            // Check if element is still in the DOM
            if (document.querySelector(`.${hash}`)) {
                return false
            }

            this.css.remove(hash)
            this.stylesCache.delete(hash)

            return true
        })
    }

    add = (value: UnistylesValues, forChild?: boolean) => {
        const generatedHash = generateHash(value)
        const hash = forChild ? `${generatedHash} > *` : generatedHash

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

    reset = () => {
        this.disposeListenersMap.forEach((dispose) => dispose())
        this.css.reset()
        this.stylesheets.clear()
        this.stylesCache.clear()
        this.dependenciesMap.clear()
        this.disposeListenersMap.clear()
        this.stylesCounter.clear()
    }
}
