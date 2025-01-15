import type { UnistyleDependency } from '../../specs'

export type ListenerProps = {
    updateTheme: VoidFunction,
    updateRuntime: VoidFunction,
    dependencies: Array<UnistyleDependency>
}
