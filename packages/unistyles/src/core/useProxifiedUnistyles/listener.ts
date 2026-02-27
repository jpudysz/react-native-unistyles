import type { ListenerProps } from './types'

import { UnistyleDependency } from '../../specs'
import * as unistyles from '../../web/services'

export const listener = ({ dependencies, updateTheme, updateRuntime }: ListenerProps) => {
    const disposeTheme = unistyles.services.listener.addListeners(
        dependencies.filter((dependency) => dependency === UnistyleDependency.Theme),
        updateTheme,
    )
    const disposeRuntime = unistyles.services.listener.addListeners(
        dependencies.filter((dependency) => dependency !== UnistyleDependency.Theme),
        (dependency) => updateRuntime(dependency === UnistyleDependency.ThemeName),
    )

    return () => {
        disposeTheme()
        disposeRuntime()
    }
}
