import { UnistyleDependency } from '../../specs'
import * as unistyles from '../../web/services'
import type { ListenerProps } from './types'

export const listener = ({ dependencies, updateTheme, updateRuntime }: ListenerProps) => {
    const disposeTheme = unistyles.services.listener.addListeners(dependencies.filter(dependency => dependency === UnistyleDependency.Theme), updateTheme)
    const disposeRuntime = unistyles.services.listener.addListeners(dependencies.filter(dependency => dependency !== UnistyleDependency.Theme), updateRuntime)

    return () => {
        disposeTheme()
        disposeRuntime()
    }
}
