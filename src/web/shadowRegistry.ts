import type { UnistylesTheme, UnistylesValues } from '../types'
import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'
import { deepMergeObjects } from '../utils'
import { extractSecrets, extractUnistyleDependencies } from './utils'
import { getVariants } from './variants'

class UnistylesShadowRegistryBuilder {
    // MOCKS
    name = 'UnistylesShadowRegistry'
    __type = 'web'
    equals = () => true
    toString = () => 'UnistylesShadowRegistry'
    dispose = () => {}
    // END MOCKS

    private selectedVariants = new Map<string, string | boolean | undefined>()
    private scopedTheme: UnistylesTheme | undefined = undefined

    add = (_ref: any, _styles: any) => {}

    addStyles = (unistyle: UnistylesValues) => {
        const getParsedStyles = () => {
            const secrets = extractSecrets(unistyle)

            // Regular style
            if (!secrets) {
                return unistyle
            }

            const { __uni__key, __uni__stylesheet, __uni__args = [] } = secrets
            const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet, scopedTheme)
            const style = newComputedStylesheet[__uni__key] as (UnistylesValues | ((...args: any) => UnistylesValues))
            const result = typeof style === 'function'
                ? style(...__uni__args)
                : style
            const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
            const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})
            const dependencies = extractUnistyleDependencies(resultWithVariants)

            if (typeof __uni__stylesheet === 'function') {
                // Add dependencies from dynamic styles to stylesheet
                UnistylesRegistry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
            }

            return resultWithVariants as UnistylesValues
        }

        // Copy scoped theme to not use referenced value
        const variants = this.getVariants()
        const scopedTheme = this.scopedTheme
        const parsedStyles = getParsedStyles()
        const { hash, existingHash } = UnistylesRegistry.add(parsedStyles)
        const injectedClassNames = parsedStyles?._web?._classNames ?? []
        const injectedClassName = Array.isArray(injectedClassNames) ? injectedClassNames.join(' ') : injectedClassNames
        const dependencies = extractUnistyleDependencies(parsedStyles)

        if (!existingHash) {
            const dispose = UnistylesListener.addListeners(dependencies, () => {
                UnistylesRegistry.applyStyles(hash, getParsedStyles())
            })

            // Dispose somewhere?
            dispose
        }

        return { injectedClassName, hash }
    }

    selectVariants = (variants?: Record<string, string | boolean | undefined>) => {
        if (!variants) {
            this.selectedVariants.clear()

            return
        }

        Object.entries(variants).forEach(([key, value]) => {
            this.selectedVariants.set(key, value)
        })
    }

    setScopedTheme = (theme?: UnistylesTheme) => {
        this.scopedTheme = theme
    }

    getScopedTheme = () => this.scopedTheme

    getVariants = () => Object.fromEntries(this.selectedVariants.entries())

    remove = (_ref: any) => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
