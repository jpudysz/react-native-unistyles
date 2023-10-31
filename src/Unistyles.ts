import { UnistylesModule } from './UnistylesModule'
import { UnistylesRuntime } from './UnistylesRuntime'
import { UnistylesEngine } from './UnistylesEngine'
import { UnistyleRegistry } from './UnistyleRegistry'
import type { UnistylesBridge } from './types'
import { UnistylesError } from './types'

class Unistyles {
    private _runtime: UnistylesRuntime
    private _engine: UnistylesEngine
    private _registry: UnistyleRegistry
    private _bridge: UnistylesBridge

    constructor() {
        const isInstalled = UnistylesModule?.install() ?? false

        if (!isInstalled) {
            throw new Error(UnistylesError.RuntimeUnavailable)
        }

        // todo add typings to global
        // @ts-ignore
        this._bridge = global.__UNISTYLES__ as UnistylesBridge
        this._registry = new UnistyleRegistry(this._bridge)
        this._runtime = new UnistylesRuntime(this._bridge, this._registry)
        this._engine = new UnistylesEngine(this._registry, this._runtime)
    }

    public get registry() {
        return this._registry
    }

    public get runtime() {
        return this._runtime
    }

    public get engine() {
        return this._engine
    }
}

export const unistyles = new Unistyles()
