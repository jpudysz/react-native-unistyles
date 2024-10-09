import type { TypeStyle } from 'typestyle'
import type { ReactNativeStyleSheet } from '../types'
import type { StyleSheetWithSuperPowers, StyleSheet } from '../types/stylesheet'
import { UnistylesRegistry } from './registry'
import { keyInObject, reduceObject, toReactNativeClassName } from './utils'
import { UnistylesRuntime } from './runtime'
import { createUseVariants, getVariants } from './variants'
import { UnistylesListener } from './listener'
import type { UnistyleDependency } from '../specs/NativePlatform'

type ListenToDependenciesProps = {
    value: StyleSheet[keyof StyleSheet],
    key: PropertyKey,
    unistyles: TypeStyle,
    className: string,
    args?: Array<any>
}

type WebUnistyle = ReturnType<typeof UnistylesRegistry.createStyles>

export const create = (stylesheet: StyleSheetWithSuperPowers<StyleSheet>) => {
    const computedStylesheet = typeof stylesheet === 'function'
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet
    let lastlySelectedVariants: Record<string, any> = {}

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
            const webUnistyleByRef = new Map<HTMLElement, WebUnistyle>()
            const disposeByRef = new Map<HTMLElement, VoidFunction | undefined>()

            return (...args: Array<any>) => {
                const [ref] = args.slice(-1)
                const result = value(...args)
                const variants = Object.fromEntries(getVariants({ [key]: result } as ReactNativeStyleSheet<StyleSheet>, lastlySelectedVariants))
                const resultWithVariants = {
                    ...result,
                    ...variants[key]
                }

                if (ref instanceof HTMLElement) {
                    const storedWebUnistyle = webUnistyleByRef.get(ref)
                    const webUnistyle = storedWebUnistyle ?? UnistylesRegistry.createStyles(resultWithVariants, key)

                    webUnistyleByRef.set(ref, webUnistyle)
                    disposeByRef.get(ref)?.()
                    disposeByRef.set(ref, listenToDependencies({
                        key,
                        value,
                        unistyles: webUnistyle.unistyles,
                        className: webUnistyle.className,
                        args
                    }))
                    ref.classList.add(webUnistyle.className)

                    if (storedWebUnistyle) {
                        UnistylesRegistry.updateStyles(webUnistyle.unistyles, resultWithVariants, webUnistyle.className)
                    }


                    return
                }

                return toReactNativeClassName(null, resultWithVariants)
            }
        }

        const { className, unistyles } = UnistylesRegistry.createStyles(value, key)

        listenToDependencies({ key, value, unistyles, className })

        return toReactNativeClassName(className, value)
    }) as ReactNativeStyleSheet<StyleSheet>

    createUseVariants(styles, newVariants => {
        lastlySelectedVariants = newVariants
    })

    return styles
}
