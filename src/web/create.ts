import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { assignSecrets, error, removeInlineStyles } from './utils'
import { UnistylesRuntime } from './runtime'
import { UnistylesShadowRegistry } from '../specs'

const useVariants = ['useVariants', (variants: Record<string, string | boolean>) => {
    UnistylesShadowRegistry.selectVariants(variants)
}]

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, id?: string) => {
    if (!id) {
        throw error('Unistyles is not initialized correctly. Please add babel plugin to your babel config.')
    }

    const computedStylesheet = typeof stylesheet === 'function'
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet

    const addSecrets = (value: any, key: string, args?: Array<any>) => assignSecrets(value, {
        __uni__key: key,
        __uni__stylesheet: stylesheet,
        __uni__args: args,
        __uni__refs: new Set()
    })

    const styleSheetStyles = Object.entries(computedStylesheet).map(([key, value]) => {
        if (typeof value === 'function') {
            return [key, (...args: Array<any>) => {
                const result = removeInlineStyles(value(...args))

                return addSecrets(result, key, args)
            }]
        }

        return [key, addSecrets(removeInlineStyles(value), key)]
    })

    return Object.fromEntries(styleSheetStyles.concat([useVariants]))
}
