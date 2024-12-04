import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { assignSecrets, error, keyInObject } from './utils'
import { UnistylesRuntime } from './runtime'
import { UnistylesShadowRegistry } from '../specs'

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
    })

    return new Proxy(computedStylesheet, {
        get: (target, key) => {
            if (key === 'useVariants') {
                return (variants: Record<string, string | boolean>) => {
                    // @ts-expect-error - This is hidden from TS
                    UnistylesShadowRegistry.selectVariants(variants)
                }
            }

            if (!keyInObject(target, key)) {
                return undefined
            }

            const value = target[key]

            if (typeof value === 'function') {
                const dynamicStyle = (...args: Array<any>) => {
                    const result = value(...args)

                    return addSecrets(result, key, args)
                }

                return dynamicStyle
            }

            const clonedValue = { ...value }

            return addSecrets(clonedValue, key)
        }
    })
}
