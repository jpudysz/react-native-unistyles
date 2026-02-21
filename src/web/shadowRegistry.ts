import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'
import type { UnistylesTheme, UnistylesValues } from '../types'
import { deepMergeObjects } from '../utils'
import type { UniGeneratedStyle, UnistylesServices } from './types'
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
    private _containerName: string | undefined = undefined
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

        const getParsedStyles = () => {
            const allStyles = unistyles.map(unistyle => {
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
                const newComputedStylesheet = this.services.registry.getComputedStylesheet(__uni__stylesheet, scopedTheme)
                const style = newComputedStylesheet[__uni__key] as (UnistylesValues | ((...args: any) => UnistylesValues))
                const result = typeof style === 'function'
                    ? style(...__uni__args)
                    : style
                const variantsResult = getVariants(result, variants)
                const resultWithVariants = deepMergeObjects(result, variantsResult)
                const dependencies = extractUnistyleDependencies(resultWithVariants)

                if (typeof __uni__stylesheet === 'function') {
                    // Add dependencies from dynamic styles to stylesheet
                    this.services.registry.addDependenciesToStylesheet(__uni__stylesheet, dependencies)
                }

                return {
                    ...resultWithVariants,
                    ...resultWithVariants._web
                } as UnistylesValues
            })

            return deepMergeObjects(...allStyles)
        }

        // Copy scoped theme and container name to not use referenced values
        const scopedTheme = this.scopedTheme
        const containerName = this._containerName
        const parsedStyles = getParsedStyles()
        const { hash, existingHash } = this.services.registry.add(parsedStyles, forChild, containerName)
        const injectedClassNames = parsedStyles?._web?._classNames ?? []
        const injectedClassName = Array.isArray(injectedClassNames) ? injectedClassNames.join(' ') : injectedClassNames
        const dependencies = extractUnistyleDependencies(parsedStyles)
        const filteredDependencies = this.services.state.CSSVars
            ? dependencies.filter(dependency => dependency !== UnistyleDependency.Theme)
            : dependencies

        if (!existingHash) {
            this.disposeMap.set(hash, this.services.listener.addListeners(filteredDependencies, () => {
                this.services.registry.applyStyles(hash, getParsedStyles(), containerName)
            }))
        }

        const hashClassname = forChild
            ? hash.replace(' > *', '')
            : hash

        return { injectedClassName, hash: hashClassname, parsedStyles }
    }

    setScopedTheme = (theme?: UnistylesTheme) => {
        this.scopedTheme = theme
    }

    getScopedTheme = () => this.scopedTheme

    setContainerName = (name?: string) => {
        this._containerName = name
    }

    getContainerName = () => this._containerName

    remove = (ref: any, hash?: string) => {
        if (isServer() || !(ref instanceof HTMLElement) || !hash) {
            return
        }

        this.services.registry.remove(ref, hash)
            .then(removed => {
                if (!removed) {
                    return
                }

                this.disposeMap.get(hash)?.()
                this.disposeMap.delete(hash)
            })
    }

    flush = () => {}
}
