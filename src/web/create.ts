import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet } from '../types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { UnistylesRegistry } from './registry'
import { keyInObject, reduceObject, toReactNativeClassName } from './utils'
import { UnistylesRuntime } from './runtime'
import { createUseVariants } from './useVariants'
import { UnistylesListener } from './listener'
import type { UnistyleDependency } from '../specs/NativePlatform'

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

        return UnistylesListener.addListeners(dependencies, () => {
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
            const classNameMap = new Map<number, string>()
            const unistylesMap = new Map<number, TypeStyle>()
            const disposeMap = new Map<number, VoidFunction | undefined>()

            return (...args: Array<any>) => {
                const [id] = args.slice(-1)
                const result = value(...args.slice(0, -1))
                const dispose = disposeMap.get(id)
                const unistyles = unistylesMap.get(id)
                const className = classNameMap.get(id)

                if (unistyles && className && dispose) {
                    dispose()
                    UnistylesRegistry.updateStyles(unistyles, result, className)
                    disposeMap.set(id, listenToDependencies({
                        key,
                        value,
                        unistyles,
                        className,
                        args
                    }))

                    return toReactNativeClassName(className, result)
                }

                const entry = UnistylesRegistry.createStyles(result, key)

                classNameMap.set(id, entry.className)
                unistylesMap.set(id, entry.unistyles)
                disposeMap.set(id, listenToDependencies({
                    key,
                    value,
                    unistyles: entry.unistyles,
                    className: entry.className,
                    args
                }))

                return toReactNativeClassName(entry.className, result)
            }
        }

        const { className, unistyles } = UnistylesRegistry.createStyles(value, key)

        listenToDependencies({ key, value, unistyles, className })

        return toReactNativeClassName(className, value)
    }) as ReactNativeStyleSheet<StyleSheet>

    createUseVariants(styles)

    return styles
}
