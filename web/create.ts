import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet } from '../src/types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../src/types/stylesheet'
import { UnistylesRegistry } from './registry'
import { reduceObject, toReactNativeClassName } from './utils'
import { UnistylesRuntime } from './runtime'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    if (typeof stylesheet === 'function') {
        stylesheet = stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
    }

    return reduceObject(stylesheet, (value, key) => {
        if (typeof value === 'function') {
            let className = ''
            let stylesheet: TypeStyle | undefined

            return (...args: Array<any>) => {
                if (stylesheet) {
                    UnistylesRegistry.updateStyles(stylesheet, value(...args), className)

                    return toReactNativeClassName(className)
                }

                const entry = UnistylesRegistry.createStyles(value(...args), key)

                className = entry.className
                stylesheet = entry.unistyles

                return toReactNativeClassName(className)
            }
        }

        return toReactNativeClassName(UnistylesRegistry.createStyles(value, key).className)
    }) as ReactNativeStyleSheet<StyleSheet>
}
