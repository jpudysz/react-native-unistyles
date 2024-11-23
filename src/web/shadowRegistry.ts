import type { UnistylesValues } from '../types'
import { convertUnistyles } from './convert'
import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'
import { deepMergeObjects } from '../utils'
import { equal, extractSecrets, extractUnistyleDependencies, isInDocument } from './utils'
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

    add = (ref: any, styles: Array<Style>, _variants: Record<string, any> | undefined, _args: Array<Array<any>>) => {
        // Styles are not provided
        if (!styles) {
            return
        }

        // Ref is unmounted, remove style tags from the document
        if (ref === null) {
            extractSecrets(styles).forEach(({ __uni__refs }) => {
                __uni__refs.forEach(ref => {
                    if (isInDocument(ref)) {
                        return
                    }

                    const oldResult = this.resultsMap.get(ref)
                    this.resultsMap.delete(ref)
                    this.classNamesMap.delete(ref)

                    if (oldResult) {
                        UnistylesRegistry.remove(oldResult)
                    }
                })
            })

            return
        }

        // Ref is not an HTMLElement
        if (!(ref instanceof HTMLElement)) {
            return
        }

        const parsedStyles = styles.flatMap((style, styleIndex) => {
            const secrets = extractSecrets(style)

            // Regular style
            if (secrets.length === 0) {
                return style as UnistylesValues
            }

            return secrets.map(secret => {
                const { __uni__key, __uni__stylesheet, __uni__variants, __uni__args = [], __uni__refs } = secret
                const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
                const style = newComputedStylesheet[__uni__key] as (UnistylesValues | ((...args: any) => UnistylesValues))
                const variants = _variants && Object.keys(_variants).length > 0 ? _variants : __uni__variants
                const args = _args[styleIndex] && _args[styleIndex].length > 0 ? _args[styleIndex] : __uni__args
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

                __uni__refs.add(ref)

                const dispose = UnistylesListener.addListeners(extractUnistyleDependencies(resultWithVariants), () => {
                    const hash = this.hashMap.get(ref)

                    // Dispose listener if there is no hash
                    if (!hash) {
                        dispose()

                        return
                    }

                    const newComputedStyleSheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
                    const newValue = newComputedStyleSheet[__uni__key] as (UnistylesValues | ((...args: any) => UnistylesValues))
                    const result = typeof newValue === 'function'
                        ? newValue(...args)
                        : newValue
                    const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
                    const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})

                    UnistylesRegistry.applyStyles(hash, convertUnistyles(resultWithVariants))
                })

                return resultWithVariants as UnistylesValues
            })
        })
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

        this.classNamesMap.set(ref, newClassNames)
        // Add new classnames to the ref
        ref.classList.add(...newClassNames)

        // If it is new hash add it to the map to use for the listener
        if (!existingHash) {
            this.hashMap.set(ref, hash)
        }

        return newClassNames
    }

    remove = () => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
