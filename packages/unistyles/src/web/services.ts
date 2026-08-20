import React from 'react'

import type { UnistylesConfig } from '../specs/StyleSheet'
import type { UnistylesServices as UnistylesServicesType } from './types'

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
    // @ts-ignore
    var __unistyles__: UnistylesServices
}

const createServices = () => new UnistylesServices()
const serverReact = React as typeof React & {
    cache?: <T>(factory: () => T) => () => T
    cacheSignal?: () => AbortSignal | null
}
const cache = serverReact.cache ?? (<T>(factory: () => T) => factory)
const getCachedServerServices = cache(createServices)

const getGlobalServices = () => {
    if (!globalThis.__unistyles__) {
        globalThis.__unistyles__ = createServices()
    }

    return globalThis.__unistyles__
}

const getServerServices = () => {
    const globalServices = getGlobalServices()

    if (!serverReact.cache || (serverReact.cacheSignal && !serverReact.cacheSignal())) {
        return globalServices
    }

    const firstServices = getCachedServerServices()

    // React's regular renderer treats cache as a pass-through. RSC renderers
    // return the same value within a request and invalidate it between requests.
    if (!serverReact.cacheSignal && firstServices !== getCachedServerServices()) {
        return globalServices
    }

    if (globalServices.state.isInitialized && !firstServices.state.isInitialized) {
        firstServices.state.init(globalServices.state.getConfig())
    }

    return firstServices
}

const serverServices = new Proxy({} as UnistylesServicesType, {
    get: (_, property: keyof UnistylesServicesType) => getServerServices()[property],
})

// Next.js can evaluate the package root and subpath exports in separate client
// module graphs. Keep one browser runtime so every entrypoint observes the same
// configuration, stylesheet registry, and hydration state.
export const services = isServer() ? serverServices : getGlobalServices()

export const configureServices = (config: UnistylesConfig) => {
    if (!isServer()) {
        services.state.init(config)

        return
    }

    const globalServices = getGlobalServices()

    globalServices.state.init(config)
    getServerServices().state.init(config)
}
