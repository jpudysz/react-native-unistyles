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

// On the server, a route can be loaded before StyleSheet.configure runs: Expo Router reads the matched route's
// metadata before rendering the document that imports the config. Such a StyleSheet is created on first use instead
const createOnFirstUse = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    let styles: ReturnType<typeof createStyleSheet> | undefined
    const getStyles = () => (styles ??= createStyleSheet(stylesheet))

    return new Proxy({} as ReturnType<typeof createStyleSheet>, {
        get: (_, key) => Reflect.get(getStyles(), key),
        has: (_, key) => Reflect.has(getStyles(), key),
        ownKeys: () => Reflect.ownKeys(getStyles()),
        getOwnPropertyDescriptor: (_, key) => {
            const descriptor = Reflect.getOwnPropertyDescriptor(getStyles(), key)

            return descriptor && { ...descriptor, configurable: true }
        },
    })
}

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    if (unistyles.services.state.isInitialized) {
        return createStyleSheet(stylesheet)
    }

    if (isServer()) {
        return createOnFirstUse(stylesheet)
    }

    // For SSR
    const config = window?.__UNISTYLES_STATE__?.config

    config && unistyles.services.state.init(config)

    return createStyleSheet(stylesheet)
}
