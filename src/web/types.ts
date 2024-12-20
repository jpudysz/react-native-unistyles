import type { UnistylesListener } from './listener'
import type{ UnistylesRegistry } from './registry'
import type{ UnistylesRuntime } from './runtime'
import type{ UnistylesShadowRegistry } from './shadowRegistry'
import type{ UnistylesState } from './state'

export type UnistylesServices = {
    runtime: UnistylesRuntime,
    registry: UnistylesRegistry,
    shadowRegistry: UnistylesShadowRegistry,
    state: UnistylesState,
    listener: UnistylesListener
}
