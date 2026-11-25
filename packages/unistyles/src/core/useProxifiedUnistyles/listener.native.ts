import type { ListenerProps } from './types'

import { StyleSheet, UnistyleDependency } from '../../specs'

const isThemeDependency = (dependency: UnistyleDependency) =>
    dependency === UnistyleDependency.Theme || dependency === UnistyleDependency.ThemeName

export const listener = ({ dependencies, updateTheme, updateRuntime }: ListenerProps) => {
    const listensToTheme = dependencies.includes(UnistyleDependency.Theme)
    const dispose = StyleSheet.addChangeListener((changedDependencies) => {
        if (listensToTheme && changedDependencies.includes(UnistyleDependency.Theme)) {
            updateTheme()
        }

        const changedListenedDependencies = changedDependencies.filter((dependency: UnistyleDependency) =>
            dependencies.includes(dependency),
        )

        if (changedListenedDependencies.length > 0) {
            updateRuntime(changedListenedDependencies.every(isThemeDependency))
        }
    })

    return () => dispose()
}
