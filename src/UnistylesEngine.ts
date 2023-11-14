import type { UnistylesRuntime } from './UnistylesRuntime'
import { getKeyForUnistylesMediaQuery } from './utils'
import type { UnistylesEngine, NestedKeys } from './types'

export class UnistylesBuiltInEngine implements UnistylesEngine {
    constructor(private runtime: UnistylesRuntime) {
        // this.registry = registry
        this.runtime = runtime
    }

    public didMatchMediaQuery = (keys: NestedKeys) => getKeyForUnistylesMediaQuery(keys, this.runtime.screen)

    // UnistylesEngine.parseStyleSheet
    // UnistylesEngine.parseStyle
    // UnistylesEngine.proxify
}
