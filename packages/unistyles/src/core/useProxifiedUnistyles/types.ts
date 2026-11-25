import type { UnistyleDependency } from '../../specs'

export type ListenerProps = {
    updateTheme: VoidFunction
    updateRuntime(isThemeChangeOnly: boolean): void
    dependencies: Array<UnistyleDependency>
}
