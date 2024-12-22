import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { UnistylesWeb } from './index'
import { assignSecrets, error, removeInlineStyles } from './utils'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, id?: string) => {
    if (!id) {
        throw error('Unistyles is not initialized correctly. Please add babel plugin to your babel config.')
    }

    const computedStylesheet = UnistylesWeb.registry.getComputedStylesheet(stylesheet)
    const addSecrets = (value: any, key: string, args?: Array<any>) => assignSecrets(value, {
        __uni__key: key,
        __uni__stylesheet: stylesheet,
        __uni__args: args
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
    const emptyVariants = ['__stylesheetVariants', {}]

    const useVariants = ['useVariants', (variants: Record<string, string | boolean | undefined>) => {
        return Object.fromEntries(styleSheetStyles.concat([useVariants, ['__stylesheetVariants', variants]]))
    }]

    return Object.fromEntries(styleSheetStyles.concat([useVariants, emptyVariants]))
}
