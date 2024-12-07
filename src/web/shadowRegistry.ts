import type { UnistylesValues } from '../types'
import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'
import { deepMergeObjects } from '../utils'
import { equal, extractSecrets, extractUnistyleDependencies, keyInObject } from './utils'
import { getVariants } from './variants'

type Style = UnistylesValues | ((...args: Array<any>) => UnistylesValues)

class UnistylesShadowRegistryBuilder {
    // MOCKS
    name = 'UnistylesShadowRegistry'
    __type = 'web'
    equals = () => true
    toString = () => 'UnistylesShadowRegistry'
    dispose = () => {}
    // END MOCKS

    private resultsMap = new Map<HTMLElement, UnistylesValues>()
    private hashMap = new Map<HTMLElement, string>()
    private classNamesMap = new Map<HTMLElement, Array<string>>()
    private selectedVariants = new Map<string, string | boolean>()

    add = (ref: any, styles: Array<Style>) => {
        // Styles are not provided
        if (!styles) {
            return
        }

        // Ref is unmounted, remove style tags from the document
        if (ref === null) {
            return
        }

        // Ref is not an HTMLElement
        if (!(ref instanceof HTMLElement)) {
            return
        }

        const getParsedStyles = () => {
            return styles.flat().flatMap(unistyleStyle => {
                if (!unistyleStyle) {
                    return []
                }

                const secrets = extractSecrets(unistyleStyle)

                // Regular style
                if (!secrets) {
                    Object.keys(unistyleStyle).forEach(key => {
                        if (keyInObject(ref.style, key)) {
                            // @ts-expect-error - Styles won't have read only properties
                            ref.style[key] = ''
                        }
                    })

                    return unistyleStyle as UnistylesValues
                }

                const { __uni__key, __uni__stylesheet, __uni__args = [] } = secrets
                    const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
                    const style = newComputedStylesheet[__uni__key] as (UnistylesValues | ((...args: any) => UnistylesValues))
                    const variants = Object.fromEntries(this.selectedVariants.entries())
                    const args = __uni__args
                    const result = typeof style === 'function'
                        ? style(...args)
                        : style
                    const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
                    const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})
                    const dependencies = extractUnistyleDependencies(resultWithVariants)

                    if (typeof __uni__stylesheet === 'function') {
                        // Add dependencies from dynamic styles to stylesheet
                        UnistylesRegistry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
                    }

                    return resultWithVariants as UnistylesValues
            })
        }
        const parsedStyles = getParsedStyles()
        const combinedStyles = deepMergeObjects(...parsedStyles)
        const oldStyles = this.resultsMap.get(ref)

        if (equal(combinedStyles, oldStyles)) {
            return
        }

        const oldClassNames = this.classNamesMap.get(ref)

        // Remove old styles
        if (oldStyles) {
            UnistylesRegistry.remove(oldStyles)
        }

        // Remove old classnames from the ref
        oldClassNames?.forEach(className => ref.classList.remove(className))
        this.resultsMap.set(ref, combinedStyles)

        const { hash, existingHash } = UnistylesRegistry.add(combinedStyles)
        const injectedClassNames = combinedStyles?._web?._classNames ?? []
        const newClassNames = (Array.isArray(injectedClassNames) ? injectedClassNames : [injectedClassNames]).concat(hash)
        const dependencies = Array.from(new Set(parsedStyles.flatMap(style => extractUnistyleDependencies(style))))

        if (!existingHash) {
            const dispose = UnistylesListener.addListeners(dependencies, () => {
                const hash = this.hashMap.get(ref)

                // Dispose listener if there is no hash
                if (!hash) {
                    dispose()

                    return
                }

                UnistylesRegistry.applyStyles(hash, deepMergeObjects(...getParsedStyles()))
            })
        }

        this.classNamesMap.set(ref, newClassNames)
        // Add new classnames to the ref
        ref.classList.add(...newClassNames)

        // If it is new hash add it to the map to use for the listener
        if (!existingHash) {
            this.hashMap.set(ref, hash)
        }

        return newClassNames
    }

    selectVariants = (variants?: Record<string, string | boolean>) => {
        if (!variants) {
            this.selectedVariants.clear()

            return
        }

        Object.entries(variants).forEach(([key, value]) => {
            this.selectedVariants.set(key, value)
        })
    }

    remove = () => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
