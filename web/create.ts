import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet } from '../src/types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../src/types/stylesheet'
import { UnistylesRegistry } from './registry'
import { reduceObject, toReactNative } from './utils'

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    if (typeof stylesheet === 'function') {
        return {}
    }

    return reduceObject(stylesheet, (value, key) => {
        if (typeof value === 'function') {
            let className = ''
            let stylesheet: TypeStyle | undefined

            return (...args: Array<any>) => {
                if (stylesheet) {
                    className = UnistylesRegistry.updateStyles(stylesheet, value(...args), key)

                    return toReactNative(className)
                }

                const entry = UnistylesRegistry.create(value(...args), key)

                className = entry.className
                stylesheet = entry.unistyles

                return toReactNative(className)
            }
        }

        return toReactNative(UnistylesRegistry.create(value, key).className)
    }) as ReactNativeStyleSheet<StyleSheet>
}
