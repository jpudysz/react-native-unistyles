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
    const styles = {} as ReturnType<typeof createStyleSheet>
    let isCreated = false
    // The styles fill the proxy's own target, so it behaves like the object create returns (writes, freeze...)
    const getStyles = () => {
        if (!isCreated) {
            Object.assign(styles, createStyleSheet(stylesheet))
            isCreated = true
        }

        return styles
    }
    // Reflect has a method for every proxy trap
    const traps = Object.getOwnPropertyNames(Reflect) as Array<keyof ProxyHandler<object>>
    const handler = Object.fromEntries(
        traps.map((trap) => [
            trap,
            (_: object, ...args: Array<any>) => (Reflect[trap] as Function)(getStyles(), ...args),
        ]),
    )

    return new Proxy(styles, handler)
}

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    if (unistyles.services.state.isInitialized) {
        return createStyleSheet(stylesheet)
    }

    // A plain object doesn't read the config, so it can be created right away
    if (isServer() && typeof stylesheet === 'function') {
        return createOnFirstUse(stylesheet)
    }

    // For SSR
    const config = window?.__UNISTYLES_STATE__?.config

    config && unistyles.services.state.init(config)

    return createStyleSheet(stylesheet)
}
