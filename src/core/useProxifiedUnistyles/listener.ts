import { UnistyleDependency } from '../../specs'
import { UnistylesWeb } from '../../web'
import type { ListenerProps } from './types'

export const listener = ({ dependencies, updateTheme, updateRuntime }: ListenerProps) => {
    const disposeTheme = UnistylesWeb.listener.addListeners(
        dependencies.filter(dependency => dependency === UnistyleDependency.Theme),
        updateTheme,
    )
    const disposeRuntime = UnistylesWeb.listener.addListeners(
        dependencies.filter(dependency => dependency !== UnistyleDependency.Theme),
        updateRuntime,
    )

    return () => {
        disposeTheme()
        disposeRuntime()
    }
}
