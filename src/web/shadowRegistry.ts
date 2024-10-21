import type { UnistylesValues } from '../types'
import { UnistylesRegistry } from './registry'
import { createDoubleMap, equal, extractSecrets, extractUnistyleDependencies, isInDocument } from './utils'
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

    private resultsMap = createDoubleMap<HTMLElement, string, UnistylesValues>()
    private classNamesMap = createDoubleMap<HTMLElement, string, Array<string>>()

    add = (ref: any, _style?: Style | Array<Style>, _variants?: Record<string, any>, _args?: Array<any>) => {
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

            secrets.forEach(({ __uni__refs, __uni__key }) => {
                __uni__refs.forEach(ref => {
                    if (isInDocument(ref)) {
                        return
                    }

                    const oldResult = this.resultsMap.get(ref, __uni__key)
                    this.resultsMap.delete(ref, __uni__key)
                    this.classNamesMap.delete(ref, __uni__key)

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
            const resultWithVariants = {
                ...result,
                ...variantsResult
            }
            const oldResult = this.resultsMap.get(ref, __uni__key)

            // If results are the same do nothing
            if (equal(oldResult, resultWithVariants)) {
                return
            }

            const oldClassNames = this.classNamesMap.get(ref, __uni__key)

            // Remove old styles
            if (oldResult) {
                UnistylesRegistry.remove(oldResult)
            }

            // Remove old classnames from the ref
            oldClassNames?.forEach(className => ref.classList.remove(className))
            this.resultsMap.set(ref, __uni__key, resultWithVariants)

            const className = UnistylesRegistry.add({
                key: __uni__key,
                args,
                stylesheet: __uni__stylesheet,
                value: resultWithVariants,
                variants
            })
            const injectedClassNames: Array<string> = resultWithVariants?._web?._classNames ?? []
            const newClassNames = injectedClassNames.concat(className)
            const dependencies = extractUnistyleDependencies(resultWithVariants)

            if (typeof __uni__stylesheet === 'function') {
                // Add dependencies from dynamic styles to stylesheet
                UnistylesRegistry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
            }

            __uni__refs.add(ref)
            this.classNamesMap.set(ref, __uni__key, newClassNames)
            // Add new classnames to the ref
            ref.classList.add(...newClassNames)
        })
    }

    remove = () => {}
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
