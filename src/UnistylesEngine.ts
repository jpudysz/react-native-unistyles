import type { UnistyleRegistry } from './UnistyleRegistry'
import type { UnistylesRuntime } from './UnistylesRuntime'

// todo implement engine
export class UnistylesEngine {
    // @ts-ignore
    constructor(private registry: UnistyleRegistry, private runtime: UnistylesRuntime) {
        this.registry = registry
        this.runtime = runtime
    }

    // UnistylesEngine.parseStyleSheet
    // UnistylesEngine.parseStyle
    // UnistylesEngine.proxify
}
