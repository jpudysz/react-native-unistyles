import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'
import { UnistylesWeb } from './index'
import { assignSecrets, error, isServer, removeInlineStyles } from './utils'

type Variants = Record<string, string | boolean | undefined>

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>, id?: string) => {
    if (!id) {
        throw error('Unistyles is not initialized correctly. Please add babel plugin to your babel config.')
    }

    // For SSR
    if (!UnistylesWeb.state.isInitialized && !isServer()) {
        const config = window?.__UNISTYLES_STATE__?.config

        config && UnistylesWeb.state.init(config)
    }

    const computedStylesheet = UnistylesWeb.registry.getComputedStylesheet(stylesheet)
    const addSecrets = (value: any, key: string, args = undefined as Array<any> | undefined, variants = {} as Variants) => assignSecrets(value, {
        __uni__key: key,
        __uni__stylesheet: stylesheet,
        __uni__args: args,
        __uni_variants: variants
    })

    const createStyleSheetStyles = (variants?: Variants) => {
        const stylesEntries = Object.entries(computedStylesheet).map(([key, value]) => {
            if (typeof value === 'function') {
                return [key, (...args: Array<any>) => {
                    const result = removeInlineStyles(value(...args))

                    return addSecrets(result, key, args, variants)
                }]
            }

            return [key, addSecrets(removeInlineStyles(value), key, undefined, variants)]
        })

        return Object.fromEntries(stylesEntries.concat([useVariants]))
    }

    const useVariants = ['useVariants', (variants: Variants) => {
        return createStyleSheetStyles(variants)
    }]

    return createStyleSheetStyles()
}
