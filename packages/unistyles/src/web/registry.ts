import type { UnistyleDependency, UnistylesMiniRuntime } from '../specs'
import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import type { UnistylesServices } from './types'

import { TRACK_DEPENDENCIES } from '../core/trackDependencies'
import { UnistyleDependency as Dependency } from '../specs/NativePlatform/NativePlatform.nitro'
import { CSSState } from './css'
import { createTrackedMiniRuntime, trackDependencies } from './dependencyTracker'
import { error, extractUnistyleDependencies, generateHash } from './utils'

type StyleSheetFunction = (theme: UnistylesTheme, miniRuntime: UnistylesMiniRuntime) => StyleSheet

export class UnistylesRegistry {
    private readonly stylesheets = new Map<StyleSheetWithSuperPowers<StyleSheet>, StyleSheet>()
    private readonly stylesCache = new Set<string>()
    private readonly stylesCounter = new Map<string, Set<HTMLElement>>()
    private readonly disposeListenersMap = new Map<object, VoidFunction>()
    private readonly dependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()
    // without the Babel plugin, what the StyleSheet function itself read, without the reads of its dynamic functions
    private readonly readDependenciesMap = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<UnistyleDependency>>()
    private readonly readDependenciesWatchers = new Map<StyleSheetWithSuperPowers<StyleSheet>, Set<VoidFunction>>()
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

            const { result, dependencies } = this.callStylesheet(
                stylesheet,
                scopedTheme,
                this.services.runtime.getMiniRuntime(scopedThemeName),
            )

            this.addRuntimeDependenciesToStylesheet(stylesheet, dependencies)

            return result
        }

        const computedStylesheet = this.stylesheets.get(stylesheet)

        if (computedStylesheet) {
            return computedStylesheet
        }

        const themeName = this.services.runtime.themeName
        const currentTheme = this.services.runtime.getTheme(themeName, this.services.state.CSSVars)
        const { result: createdStylesheet, dependencies: runtimeDependencies } = this.callStylesheet(
            stylesheet,
            currentTheme,
            this.services.runtime.getMiniRuntime(themeName),
        )
        const dependencies = Object.values(createdStylesheet)
            .flatMap((value) => extractUnistyleDependencies(value))
            .concat(runtimeDependencies)

        this.addDependenciesToStylesheet(stylesheet, dependencies)
        this.stylesheets.set(stylesheet, createdStylesheet)

        return createdStylesheet
    }

    // without the Babel plugin, every dependency the StyleSheet function read so far
    // a dynamic function's reads belong to the views that call it, see shadowRegistry
    getStylesheetDependencies = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) =>
        Array.from(this.readDependenciesMap.get(stylesheet) ?? [])

    // without the Babel plugin, called when the StyleSheet function reads something new
    watchStylesheetDependencies = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, onChange: VoidFunction) => {
        const watchers = this.readDependenciesWatchers.get(stylesheet) ?? new Set()

        watchers.add(onChange)
        this.readDependenciesWatchers.set(stylesheet, watchers)

        return () => {
            watchers.delete(onChange)
        }
    }

    addDependenciesToStylesheet = (stylesheet: StyleSheetFunction, dependencies: Array<UnistyleDependency>) => {
        this.disposeListenersMap.get(stylesheet)?.()

        const dependenciesMap = this.dependenciesMap.get(stylesheet) ?? new Set(dependencies)

        dependencies.forEach((dependency) => dependenciesMap.add(dependency))

        const dispose = this.services.listener.addStylesheetListeners(Array.from(dependenciesMap), () => {
            const themeName = this.services.runtime.themeName
            const { result: newComputedStylesheet, dependencies: runtimeDependencies } = this.callStylesheet(
                stylesheet,
                this.services.runtime.getTheme(themeName, this.services.state.CSSVars),
                this.services.runtime.getMiniRuntime(themeName),
            )

            this.stylesheets.set(stylesheet, newComputedStylesheet)
            this.addRuntimeDependenciesToStylesheet(stylesheet, runtimeDependencies)
        })

        this.dependenciesMap.set(stylesheet, dependenciesMap)
        this.disposeListenersMap.set(stylesheet, dispose)
    }

    // a StyleSheet may read new dependencies each time it runs, eg. behind a condition
    private addRuntimeDependenciesToStylesheet = (
        stylesheet: StyleSheetFunction,
        dependencies: Array<UnistyleDependency>,
    ) => {
        const knownDependencies = this.dependenciesMap.get(stylesheet)

        if (dependencies.some((dependency) => !knownDependencies?.has(dependency))) {
            this.addDependenciesToStylesheet(stylesheet, dependencies)
        }
    }

    // calls the user's StyleSheet function, without the Babel plugin it also returns the dependencies it read
    private callStylesheet = (
        stylesheet: StyleSheetFunction,
        theme: UnistylesTheme,
        miniRuntime: UnistylesMiniRuntime,
    ): { result: StyleSheet; dependencies: Array<UnistyleDependency> } => {
        if (!TRACK_DEPENDENCIES) {
            return { result: stylesheet(theme, miniRuntime), dependencies: [] }
        }

        const { result, dependencies: readDependencies } = trackDependencies(() =>
            stylesheet(theme, createTrackedMiniRuntime(miniRuntime)),
        )
        // every StyleSheet function receives the theme
        const dependencies = readDependencies.concat(Dependency.Theme)
        const knownDependencies = this.readDependenciesMap.get(stylesheet) ?? new Set()
        const hasNewDependencies = dependencies.some((dependency) => !knownDependencies.has(dependency))

        dependencies.forEach((dependency) => knownDependencies.add(dependency))
        this.readDependenciesMap.set(stylesheet, knownDependencies)

        if (hasNewDependencies) {
            this.readDependenciesWatchers.get(stylesheet)?.forEach((onChange) => onChange())
        }

        return { result, dependencies }
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
            // Safe to drop now: connect creates a new Set and the cleanup below only checks the DOM
            this.stylesCounter.delete(hash)

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

    add = (value: UnistylesValues, forChild?: boolean) => {
        const generatedHash = generateHash(value)
        const hash = forChild ? `${generatedHash}_child > *` : generatedHash

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
        this.readDependenciesMap.clear()
        this.readDependenciesWatchers.clear()
        this.disposeListenersMap.clear()
        this.stylesCounter.clear()
    }
}
