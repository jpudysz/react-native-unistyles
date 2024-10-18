import type { UnistyleDependency } from '../specs/NativePlatform'
import type { UnistylesValues } from '../types'
import { UnistylesRegistry } from './registry'
import { extractHiddenProperties, extractSecrets, isInDocument, keyInObject } from './utils'
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

    private resultsMap = new Map<HTMLElement, UnistylesValues>
    private classNamesMap = new Map<HTMLElement, Array<string>>()

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

            secrets.forEach(({ __uni__refs }) => {
                __uni__refs.forEach(ref => {
                    if (isInDocument(ref)) {
                        return
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
            const style = newComputedStylesheet[__uni__key]
            const args = _args ?? __uni__args
            const variants = _variants && Object.keys(_variants).length > 0 ? _variants : __uni__variants
            const resultHidden = typeof style === 'function'
                ? style(...args)
                : style
            const result = extractHiddenProperties(resultHidden)
            const { variantsResult } = Object.fromEntries(getVariants({ variantsResult: result }, variants))
            const resultWithVariants = {
                ...result,
                ...variantsResult
            }
            const oldResult = this.resultsMap.get(ref)
            const oldClassNames = this.classNamesMap.get(ref)

            if (oldResult) {
                UnistylesRegistry.remove(oldResult)
            }

            oldClassNames?.forEach(className => ref.classList.remove(className))
            this.resultsMap.set(ref, resultWithVariants)

            const className = UnistylesRegistry.add({
                key: __uni__key,
                args,
                stylesheet: __uni__stylesheet,
                value: resultWithVariants,
                variants
            })
            const injectedClassNames: Array<string> = resultWithVariants?._web?._classNames ?? []
            const newClassNames = injectedClassNames.concat(className)
            const dependencies: Array<UnistyleDependency> = keyInObject(resultWithVariants, 'uni__dependencies') ? resultWithVariants.uni__dependencies : []

            if (typeof __uni__stylesheet === 'function') {
                UnistylesRegistry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
            }

            __uni__refs.add(ref)
            this.classNamesMap.set(ref, newClassNames)
            ref.classList.add(...newClassNames)
        })
    }

    remove = (ref: HTMLElement, style: Style) => {
        extractSecrets(style).forEach(({ __uni__key }) => {
            ref
            __uni__key
        })
    }
}

export const UnistylesShadowRegistry = new UnistylesShadowRegistryBuilder()
