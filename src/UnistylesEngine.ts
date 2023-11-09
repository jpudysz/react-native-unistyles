import type { UnistyleRegistry } from './UnistyleRegistry'
import type { UnistylesRuntime } from './UnistylesRuntime'
import { getKeyForCustomMediaQuery } from './utils'
import type { UnistylesEngine, NestedKeys } from './types'

export class UnistylesBuiltInEngine implements UnistylesEngine {
    constructor(private registry: UnistyleRegistry, private runtime: UnistylesRuntime) {
        this.registry = registry
        this.runtime = runtime
    }

    public isMediaQuery = (key: string) => {
        const regex = /(:w|:h)/

        return key.length > 0 && regex.test(key)
    }

    public didMatchMediaQuery = (keys: NestedKeys) =>
        getKeyForCustomMediaQuery(keys, this.runtime.screen, this.registry.breakpoints)

    // UnistylesEngine.parseStyleSheet
    // UnistylesEngine.parseStyle
    // UnistylesEngine.proxify
}
