import { UnistylesListener } from './listener'
import { UnistylesRegistry } from './registry'
import { UnistylesRuntime } from './runtime'
import { UnistylesShadowRegistry } from './shadowRegistry'
import { UnistylesState } from './state'
import { isServer } from './utils'

class UnistylesServices {
    runtime: UnistylesRuntime
    registry: UnistylesRegistry
    shadowRegistry: UnistylesShadowRegistry
    state: UnistylesState
    listener: UnistylesListener

    private services = {} as UnistylesServices

    constructor() {
        this.runtime = new UnistylesRuntime(this.services)
        this.registry = new UnistylesRegistry(this.services)
        this.shadowRegistry = new UnistylesShadowRegistry(this.services)
        this.state = new UnistylesState(this.services)
        this.listener = new UnistylesListener(this.services)
        this.services.runtime = this.runtime
        this.services.registry = this.registry
        this.services.shadowRegistry = this.shadowRegistry
        this.services.state = this.state
        this.services.listener = this.listener
    }
}

declare global {
    var __unistyles_web__: UnistylesServices
}

if (isServer() && !globalThis.__unistyles__) {
    globalThis.__unistyles_web__ = new UnistylesServices()
}

export const UnistylesWeb = isServer() ? globalThis.__unistyles__ : new UnistylesServices()
