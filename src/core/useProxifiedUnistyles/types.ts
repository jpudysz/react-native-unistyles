import type { UnistyleDependency } from '../../specs'

export type ListenerProps = {
    updateTheme: VoidFunction
    updateRuntime(themeNameChange: boolean): void
    dependencies: Array<UnistyleDependency>
}
