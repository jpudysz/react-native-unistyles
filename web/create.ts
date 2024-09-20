import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet } from '../src/types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../src/types/stylesheet'
import { UnistylesRegistry } from './registry'
import { keyInObject, reduceObject, toReactNativeClassName } from './utils'
import { UnistylesRuntime } from './runtime'
import { createUseVariants } from './useVariants'
import { UnistylesListener, type UnistyleDependency } from './listener'

type ListenToDependenciesProps = {
    value: StyleSheet[keyof StyleSheet],
    key: PropertyKey,
    unistyles: TypeStyle,
    className: string,
    args?: Array<any>
}

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    const computedStylesheet = typeof stylesheet === 'function' 
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet

    const listenToDependencies = ({ key, className, unistyles, value, args = [] } : ListenToDependenciesProps) => {
        const dependencies = ('uni__dependencies' in value ? value['uni__dependencies'] : []) as Array<UnistyleDependency>

        if (dependencies.length === 0) {
            return
        }

        UnistylesListener.addListeners(dependencies, () => {
            const newComputedStylesheet = typeof stylesheet === 'function'
                ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
                : stylesheet

            if (!keyInObject(newComputedStylesheet, key)) {
                return
            }

            const value = newComputedStylesheet[key]!
            const result = typeof value === 'function'
                ? value(...args)
                : value

            UnistylesRegistry.updateStyles(unistyles, result, className)
        })
    }

    const styles = reduceObject(computedStylesheet, (value, key) => {
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
                listenToDependencies({ 
                    key,
                    value,
                    unistyles: stylesheet,
                    className,
                    args
                })

                return toReactNativeClassName(className, result)
            }
        }

        const { className, unistyles } = UnistylesRegistry.createStyles(value, key)

        listenToDependencies({ key, value, unistyles, className })

        return toReactNativeClassName(className, value)
    }) as ReactNativeStyleSheet<StyleSheet>

    createUseVariants(styles)

    return styles
}
