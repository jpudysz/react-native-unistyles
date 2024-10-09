import type { ReactNativeStyleSheet } from '../types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { UnistylesRegistry } from './registry'
import { assignSecrets, reduceObject, getStyles } from './utils'
import { UnistylesRuntime } from './runtime'
import { createUseVariants, getVariants } from './variants'
import { listenToDependencies } from './listener'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    const computedStylesheet = typeof stylesheet === 'function'
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet
    let lastlySelectedVariants: Record<string, any> = {}

    const styles = reduceObject(computedStylesheet, (value, _key) => {
        const key = String(_key)

        if (typeof value === 'function') {
            const dynamicStyle = (...args: Array<any>) => {
                const result = value(...args)
                const variants = Object.fromEntries(getVariants({ [key]: result } as ReactNativeStyleSheet<StyleSheet>, lastlySelectedVariants))
                const resultWithVariants = {
                    ...result,
                    ...variants[key]
                }

                return getStyles(resultWithVariants)
            }

            assignSecrets(dynamicStyle, { stylesheet, key })

            return dynamicStyle
        }

        const { className, unistyles } = UnistylesRegistry.createStyles(value, key)

        listenToDependencies({ key, unistyles, className, stylesheet })

        const staticStyle = getStyles(value)
        assignSecrets(staticStyle, { stylesheet, key })

        return staticStyle
    }) as ReactNativeStyleSheet<StyleSheet>

    createUseVariants(styles, newVariants => {
        lastlySelectedVariants = newVariants
    })

    return styles
}
