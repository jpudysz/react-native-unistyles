import type { StyleSheet, StyleSheetWithSuperPowers } from '../types/stylesheet'

import * as unistyles from './services'
import { assignSecrets, isServer, removeInlineStyles } from './utils'

type Variants = Record<string, string | boolean | undefined>

const createStyleSheet = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    const computedStylesheet = unistyles.services.registry.getComputedStylesheet(stylesheet)
    const addSecrets = (
        value: any,
        key: string,
        args = undefined as Array<any> | undefined,
        variants = {} as Variants,
    ) =>
        assignSecrets(value, {
            __uni__key: key,
            __uni__stylesheet: stylesheet,
            __uni__args: args,
            __stylesheetVariants: variants,
        })

    const createStyleSheetStyles = (variants?: Variants) => {
        const stylesEntries = Object.entries(computedStylesheet).map(([key, value]) => {
            if (typeof value === 'function') {
                return [
                    key,
                    (...args: Array<any>) => {
                        const result = removeInlineStyles(value(...args))

                        return addSecrets(result, key, args, variants)
                    },
                ]
            }

            return [key, addSecrets(removeInlineStyles(value), key, undefined, variants)]
        })

        return Object.fromEntries(stylesEntries.concat([useVariants]))
    }

    const useVariants = [
        'useVariants',
        (variants: Variants) => {
            return createStyleSheetStyles(variants)
        },
    ]

    return createStyleSheetStyles()
}

// On the server, a StyleSheet can be created before `StyleSheet.configure` runs: with Expo Router's server output,
// every route is loaded before the document (`+html`) that imports the configuration. Such a StyleSheet is created
// when first used instead, while rendering, once configured.
const createStyleSheetOnFirstUse = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    let styles: ReturnType<typeof createStyleSheet> | undefined
    const getStyles = () => {
        styles ??= createStyleSheet(stylesheet)

        return styles
    }

    return new Proxy({} as ReturnType<typeof createStyleSheet>, {
        get: (_, key) => Reflect.get(getStyles(), key),
        has: (_, key) => Reflect.has(getStyles(), key),
        ownKeys: () => Reflect.ownKeys(getStyles()),
        getOwnPropertyDescriptor: (_, key) => {
            const descriptor = Reflect.getOwnPropertyDescriptor(getStyles(), key)

            // The proxy's own target is empty: report its properties as configurable, as a Proxy requires
            return descriptor && { ...descriptor, configurable: true }
        },
    })
}

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    // For SSR
    if (!unistyles.services.state.isInitialized && !isServer()) {
        const config = window?.__UNISTYLES_STATE__?.config

        config && unistyles.services.state.init(config)
    }

    if (isServer() && !unistyles.services.state.isInitialized && typeof stylesheet === 'function') {
        return createStyleSheetOnFirstUse(stylesheet)
    }

    return createStyleSheet(stylesheet)
}
