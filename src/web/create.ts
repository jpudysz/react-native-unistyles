import type { ReactNativeStyleSheet } from '../types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { assignSecrets, reduceObject, getStyles, error } from './utils'
import { deepMergeObjects } from '../utils'
import { UnistylesRuntime } from './runtime'
import { getVariants } from './variants'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, id?: string) => {
    if (!id) {
        throw error('Unistyles is not initialized correctly. Please add babel plugin to your babel config.')
    }

    const computedStylesheet = typeof stylesheet === 'function'
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet
    const selectedVariants = new Map<string, any>()

    const copyVariants = () => Object.fromEntries(selectedVariants.entries())
    const addSecrets = (value: any, key: string, args?: Array<any>) => assignSecrets(value, {
        __uni__key: key,
        __uni__refs: new Set(),
        __uni__stylesheet: stylesheet,
        __uni__args: args,
        __uni__variants: copyVariants()
    })

    const styles = reduceObject(computedStylesheet, (value, _key) => {
        const key = String(_key)

        if (typeof value === 'function') {
            const dynamicStyle = (...args: Array<any>) => {
                const result = value(...args)
                const variants = Object.fromEntries(getVariants({ [key]: result } as ReactNativeStyleSheet<StyleSheet>, copyVariants()))
                const resultWithVariants = deepMergeObjects(result, variants[key] ?? {})

                // Add secrets to result of dynamic styles function
                return addSecrets(getStyles(resultWithVariants), key, args)
            }

            // Add secrets to dynamic styles function
            return addSecrets(dynamicStyle, key)
        }

        // Add secrets to static styles
        return addSecrets(getStyles(value), key)
    }) as ReactNativeStyleSheet<StyleSheet>

    // Inject useVariants hook to styles
    Object.defineProperty(styles, 'useVariants', {
        value: (variants: Record<string, string | boolean>) => {
            Object.entries(variants).forEach(([key, value]) => selectedVariants.set(key, value))
        },
        configurable: false,
    })

    return styles
}
