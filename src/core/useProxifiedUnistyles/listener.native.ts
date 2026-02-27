import type { ListenerProps } from './types'

import { StyleSheet, UnistyleDependency } from '../../specs'

export const listener = ({ dependencies, updateTheme, updateRuntime }: ListenerProps) => {
    const listensToTheme = dependencies.includes(UnistyleDependency.Theme)
    // @ts-expect-error - this is hidden from TS
    const dispose = StyleSheet.addChangeListener((changedDependencies) => {
        if (listensToTheme && changedDependencies.includes(UnistyleDependency.Theme)) {
            updateTheme()
        }

        if (changedDependencies.some((dependency: UnistyleDependency) => dependencies.includes(dependency))) {
            const hasThemeNameChange = changedDependencies.includes(UnistyleDependency.ThemeName)

            updateRuntime(hasThemeNameChange)
        }
    })

    return () => dispose()
}
