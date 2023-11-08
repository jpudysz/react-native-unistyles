import type { UnistyleRegistry } from './UnistyleRegistry'
import type { UnistylesRuntime } from './UnistylesRuntime'
import { getKeyForCustomMediaQuery } from './utils'
import type { UnistylesBreakpoints } from './global'
import type { MediaQueries } from './types'

// todo implement engine
export class UnistylesEngine {
    // @ts-ignore
    constructor(private registry: UnistyleRegistry, private runtime: UnistylesRuntime) {
        this.registry = registry
        this.runtime = runtime
    }

    public parseCustomMediaQuery = (mediaQueries: Array<[keyof UnistylesBreakpoints | MediaQueries, string | number | undefined]>) =>
        getKeyForCustomMediaQuery(mediaQueries, this.runtime.screen, this.registry.breakpoints)

    // UnistylesEngine.parseStyleSheet
    // UnistylesEngine.parseStyle
    // UnistylesEngine.proxify
}
