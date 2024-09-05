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
                const result = value(...args)

                if (stylesheet) {
                    UnistylesRegistry.updateStyles(stylesheet, result, className)

                    return toReactNativeClassName(className, result)
                }

                const entry = UnistylesRegistry.createStyles(result, key)

                className = entry.className
                stylesheet = entry.unistyles

                return toReactNativeClassName(className, result)
            }
        }

        return toReactNativeClassName(UnistylesRegistry.createStyles(value, key).className, value)
    }) as ReactNativeStyleSheet<StyleSheet>
}
