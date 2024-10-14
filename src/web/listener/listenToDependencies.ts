import type { TypeStyle } from 'typestyle'
import type { StyleSheet, StyleSheetWithSuperPowers } from '../../types/stylesheet'
import type { UnistyleDependency } from '../../specs/NativePlatform'
import { UnistylesListener } from './listener'
import { UnistylesRuntime } from '../runtime'
import { keyInObject } from '../utils'
import { UnistylesRegistry } from '../registry'

type ListenToDependenciesProps = {
    key: PropertyKey,
    unistyles: TypeStyle,
    className: string,
    stylesheet: StyleSheetWithSuperPowers<StyleSheet>
    args?: Array<any>
}

export const listenToDependencies = ({ key, className, unistyles, args = [], stylesheet }: ListenToDependenciesProps) => {
    const newComputedStylesheet = typeof stylesheet === 'function'
        ? stylesheet(UnistylesRuntime.theme, UnistylesRuntime.miniRuntime)
        : stylesheet
    const _value = keyInObject(newComputedStylesheet, key) ? newComputedStylesheet[key] : undefined

    if (!_value) {
        return
    }

    const value = typeof _value === 'function' ? _value(...args) : _value
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
