import { UnistyleDependency } from '../specs'
import type { UnistylesTheme, UnistylesValues } from '../types'
import { deepMergeObjects } from '../utils'
import type { UnistylesServices } from './types'
import { extractSecrets, extractUnistyleDependencies } from './utils'
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
        if (!(ref instanceof HTMLElement) || !hash) {
            return
        }

        this.services.registry.connect(ref, hash)
    }

    addStyles = (unistyles: Array<UnistylesValues>) => {
        const getParsedStyles = () => {
            const allStyles = unistyles.map(unistyle => {
                const secrets = extractSecrets(unistyle)

                // Regular style
                if (!secrets) {
                    return unistyle
                }

                const { __uni__key, __uni__stylesheet, __uni__args = [], __uni_variants: variants } = secrets
                const newComputedStylesheet = this.services.registry.getComputedStylesheet(__uni__stylesheet, scopedTheme)
                const style = newComputedStylesheet[__uni__key] as UnistylesValues | ((...args: any) => UnistylesValues)
                const result = typeof style === 'function' ? style(...__uni__args) : style
                const variantsResult = getVariants(result, variants)
                const resultWithVariants = deepMergeObjects(result, variantsResult)
                const dependencies = extractUnistyleDependencies(resultWithVariants)

                if (typeof __uni__stylesheet === 'function') {
                    // Add dependencies from dynamic styles to stylesheet
                    this.services.registry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
                }

                return resultWithVariants as UnistylesValues
            })

            return deepMergeObjects(...allStyles)
        }

        // Copy scoped theme to not use referenced value
        const scopedTheme = this.scopedTheme
        const parsedStyles = getParsedStyles()
        const { hash, existingHash } = this.services.registry.add(parsedStyles)
        const injectedClassNames = parsedStyles?._web?._classNames ?? []
        const injectedClassName = Array.isArray(injectedClassNames) ? injectedClassNames.join(' ') : injectedClassNames
        const dependencies = extractUnistyleDependencies(parsedStyles)
        const filteredDependencies = this.services.state.CSSVars
            ? dependencies.filter(dependency => dependency !== UnistyleDependency.Theme)
            : dependencies

        if (!existingHash) {
            this.disposeMap.set(
                hash,
                this.services.listener.addListeners(filteredDependencies, () => {
                    this.services.registry.applyStyles(hash, getParsedStyles())
                })
            )
        }

        return { injectedClassName, hash }
    }

    setScopedTheme = (theme?: UnistylesTheme) => {
        this.scopedTheme = theme
    }

    getScopedTheme = () => this.scopedTheme

    remove = (ref: any, hash?: string) => {
        if (!(ref instanceof HTMLElement) || !hash) {
            return
        }

        const removed = this.services.registry.remove(ref, hash)

        if (removed) {
            this.disposeMap.get(hash)?.()
            this.disposeMap.delete(hash)
        }
    }
}
