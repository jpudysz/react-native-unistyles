import type { UnistylesTheme, UnistylesValues } from '../types'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import type { UniGeneratedStyle, UnistylesServices } from './types'

import { TRACK_DEPENDENCIES } from '../core/trackDependencies'
import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'
import { deepMergeObjects } from '../utils'
import { trackDependencies } from './dependencyTracker'
import { extractSecrets, extractUnistyleDependencies, isGeneratedUnistyle, isServer } from './utils'
import { getVariants } from './variants'

export class UnistylesShadowRegistry {
    // MOCKS
    name = 'UnistylesShadowRegistry'
    __type = 'web'
    equals = () => true
    toString = () => 'UnistylesShadowRegistry'
    dispose = () => {}
    // END MOCKS

    private scopedTheme: UnistylesTheme | undefined = undefined
    private disposeMap = new Map<string, VoidFunction>()

    constructor(private services: UnistylesServices) {}

    add = (ref: any, hash?: string) => {
        if (isServer() || !(ref instanceof HTMLElement) || !hash) {
            return
        }

        this.services.registry.connect(ref, hash)
    }

    addStyles = (unistyles: Array<UnistylesValues>, forChild?: boolean) => {
        const [firstStyle] = unistyles

        // If it is already a generated style, return it
        if (firstStyle && isGeneratedUnistyle(firstStyle)) {
            return firstStyle as UniGeneratedStyle
        }

        const stylesheets = new Set<StyleSheetWithSuperPowers<StyleSheet>>()
        // without the Babel plugin, what the dynamic functions and getters of this view read in the last run
        let styleDependencies: Array<UnistyleDependency> = []
        const getParsedStyles = () => {
            styleDependencies = []

            const allStyles = unistyles.map((unistyle) => {
                const secrets = extractSecrets(unistyle)

                // Regular style
                if (!secrets) {
                    return unistyle
                }

                // Animated styles - shouldn't be processed
                if (Object.keys(secrets).length === 0) {
                    return {}
                }

                const { __uni__key, __uni__stylesheet, __uni__args = [], __stylesheetVariants: variants } = secrets

                stylesheets.add(__uni__stylesheet)

                const newComputedStylesheet = this.services.registry.getComputedStylesheet(
                    __uni__stylesheet,
                    scopedTheme,
                )
                const style = newComputedStylesheet[__uni__key] as UnistylesValues | ((...args: any) => UnistylesValues)
                const getStyle = () => {
                    const result = typeof style === 'function' ? style(...__uni__args) : style
                    const variantsResult = getVariants(result, variants)

                    return deepMergeObjects(result, variantsResult)
                }
                // without the Babel plugin, a dynamic function or a getter (copied by deepMergeObjects) records what it reads
                const { result: resultWithVariants, dependencies: runtimeDependencies } = TRACK_DEPENDENCIES
                    ? trackDependencies(getStyle)
                    : { result: getStyle(), dependencies: [] }
                const dependencies = extractUnistyleDependencies(resultWithVariants).concat(runtimeDependencies)

                styleDependencies.push(...runtimeDependencies)

                if (typeof __uni__stylesheet === 'function') {
                    // Add dependencies from dynamic styles to stylesheet
                    // it recomputes, so dynamic functions read a fresh mini runtime
                    this.services.registry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
                }

                return {
                    ...resultWithVariants,
                    ...resultWithVariants._web,
                } as UnistylesValues
            })

            return deepMergeObjects(...allStyles)
        }

        // without the Babel plugin, styles depend on everything their StyleSheet read and on what their own dynamic functions and getters read
        // reads of dynamic functions called by other views don't update this one
        const getParsedStylesWithDependencies = () => {
            const styles = getParsedStyles()
            const runtimeDependencies = TRACK_DEPENDENCIES
                ? Array.from(stylesheets)
                      .flatMap((stylesheet) => this.services.registry.getStylesheetDependencies(stylesheet))
                      .concat(styleDependencies)
                : []

            return { styles, runtimeDependencies }
        }

        // Copy scoped theme to not use referenced value
        const scopedTheme = this.scopedTheme
        const { styles: parsedStyles, runtimeDependencies } = getParsedStylesWithDependencies()
        const { hash, existingHash } = this.services.registry.add(parsedStyles, forChild)
        const injectedClassNames = parsedStyles?._web?._classNames ?? []
        const injectedClassName = Array.isArray(injectedClassNames) ? injectedClassNames.join(' ') : injectedClassNames
        const filterDependencies = (dependencies: Array<UnistyleDependency>) =>
            Array.from(new Set(dependencies)).filter(
                (dependency) => !this.services.state.CSSVars || dependency !== UnistyleDependency.Theme,
            )

        // without the Babel plugin, every style of a StyleSheet listens to everything the StyleSheet read, most of them don't change
        let lastStyles = TRACK_DEPENDENCIES ? JSON.stringify(parsedStyles) : ''

        let dependencies: Array<UnistyleDependency> = []
        let disposeListener: VoidFunction = () => {}

        const onChange = () => {
            if (!TRACK_DEPENDENCIES) {
                this.services.registry.applyStyles(hash, getParsedStyles())

                return
            }

            const { styles, runtimeDependencies } = getParsedStylesWithDependencies()
            const newStyles = JSON.stringify(styles)

            if (newStyles !== lastStyles) {
                lastStyles = newStyles
                this.services.registry.applyStyles(hash, styles)
            }

            listenToNewDependencies(runtimeDependencies)
        }
        const listen = (newDependencies: Array<UnistyleDependency>) => {
            disposeListener()
            dependencies = newDependencies
            disposeListener = this.services.listener.addListeners(dependencies, onChange)
        }
        // eg. a dependency read behind a condition
        const listenToNewDependencies = (runtimeDependencies: Array<UnistyleDependency>) => {
            const newDependencies = filterDependencies(dependencies.concat(runtimeDependencies))

            if (newDependencies.length !== dependencies.length) {
                listen(newDependencies)
            }
        }

        if (!existingHash) {
            listen(filterDependencies(extractUnistyleDependencies(parsedStyles).concat(runtimeDependencies)))

            // a StyleSheet that reruns for another view (eg. for its dynamic function) may read something new
            const unwatchStylesheets = TRACK_DEPENDENCIES
                ? Array.from(stylesheets).map((stylesheet) =>
                      this.services.registry.watchStylesheetDependencies(stylesheet, () =>
                          listenToNewDependencies(this.services.registry.getStylesheetDependencies(stylesheet)),
                      ),
                  )
                : []

            this.disposeMap.set(hash, () => {
                disposeListener()
                unwatchStylesheets.forEach((unwatch) => unwatch())
            })
        }

        const hashClassname = forChild ? hash.replace(' > *', '') : hash

        return { injectedClassName, hash: hashClassname, parsedStyles }
    }

    setScopedTheme = (theme?: UnistylesTheme) => {
        // With CSS variables, the closest ScopedTheme element picks the theme, so styles are the same in every scope.
        // Keeping no scope here also means a suspended ScopedTheme can't leave it behind
        this.scopedTheme = this.services.state.CSSVars ? undefined : theme
    }

    getScopedTheme = () => this.scopedTheme

    remove = (ref: any, hash?: string) => {
        if (isServer() || !(ref instanceof HTMLElement) || !hash) {
            return
        }

        this.services.registry.remove(ref, hash).then((removed) => {
            if (!removed) {
                return
            }

            this.disposeMap.get(hash)?.()
            this.disposeMap.delete(hash)
        })
    }

    reset = () => {
        this.disposeMap.forEach((dispose) => dispose())
        this.disposeMap.clear()
    }

    flush = () => {}
}
