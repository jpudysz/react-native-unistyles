import type { UnistylesValues } from '../types'
import { convertUnistyles } from './convert'
import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'
import { deepMergeObjects, equal, extractSecrets, extractUnistyleDependencies, isInDocument } from './utils'
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
    private timeoutMap = new Map<HTMLElement, NodeJS.Timeout>()
    private queuedResultMap = new Map<HTMLElement, Record<string, any>>()

    add = (ref: any, _style?: Style | Array<Style>, _variants?: Record<string, any>, _args?: Array<any>) => new Promise<Array<string>>(resolve => {
        // Style is not provided
        if (!_style) {
            return
        }

        // Array of styles
        if (Array.isArray(_style)) {
            _style.forEach(style => this.add(ref, style, _variants, _args))

            return
        }

        // Not a unistyle
        if (!Object.keys(_style).some(key => key.startsWith('__uni__'))) {
            return
        }

        // Ref is unmounted, remove style tags from the document
        if (ref === null) {
            const secrets = extractSecrets(_style)

            secrets.forEach(({ __uni__refs }) => {
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

        extractSecrets(_style).forEach(secret => {
            const { __uni__key, __uni__stylesheet, __uni__variants, __uni__args = [], __uni__refs } = secret
            const newComputedStylesheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
            const style = newComputedStylesheet[__uni__key]!
            const args = _args ?? __uni__args
            const variants = _variants && Object.keys(_variants).length > 0 ? _variants : __uni__variants
            const result = typeof style === 'function'
                ? style(...args)
                : style
            const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
            const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})

            // Get stored result from queue
            const storedResult = this.queuedResultMap.get(ref) ?? {}
            // Merge stored result with new result
            const newResult = deepMergeObjects(storedResult, resultWithVariants)
            const timeout = this.timeoutMap.get(ref)

            // Add callback to the queue and remove old one
            this.queuedResultMap.set(ref, newResult)
            clearTimeout(timeout)
            this.timeoutMap.set(ref, setTimeout(() => {
                const oldResult = this.resultsMap.get(ref)

                // If results are the same do nothing
                if (equal(oldResult, newResult)) {
                    return
                }

                const oldClassNames = this.classNamesMap.get(ref)

                // Remove old styles
                if (oldResult) {
                    UnistylesRegistry.remove(oldResult)
                }

                // Remove old classnames from the ref
                oldClassNames?.forEach(className => ref.classList.remove(className))
                this.resultsMap.set(ref, newResult)

                const { hash, existingHash } = UnistylesRegistry.add(newResult)
                const injectedClassNames: Array<string> = newResult?._web?._classNames ?? []
                const newClassNames = injectedClassNames.concat(hash)
                const dependencies = extractUnistyleDependencies(newResult)

                if (typeof __uni__stylesheet === 'function') {
                    // Add dependencies from dynamic styles to stylesheet
                    UnistylesRegistry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
                }

                __uni__refs.add(ref)
                this.classNamesMap.set(ref, newClassNames)
                // Add new classnames to the ref
                ref.classList.add(...newClassNames)
                resolve(newClassNames)

                // If it is new hash add it to the map to use for the listener
                if (!existingHash) {
                    this.hashMap.set(ref, hash)
                }
            }, 0))

            // Listen for theme / runtime changes
            const dispose = UnistylesListener.addListeners(extractUnistyleDependencies(newResult), () => {
                const hash = this.hashMap.get(ref)

                // Dispose listener if there is no hash
                if (!hash) {
                    dispose()

                    return
                }

                const newComputedStyleSheet = UnistylesRegistry.getComputedStylesheet(__uni__stylesheet)
                const newValue = newComputedStyleSheet[__uni__key]!
                const result = typeof newValue === 'function'
                    ? newValue(...args)
                    : newValue
                const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
                const resultWithVariants = deepMergeObjects(result, variantsResult ?? {})

                UnistylesRegistry.applyStyles(hash, convertUnistyles(resultWithVariants))
            })
        })
    })

    remove = () => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
