import { UnistylesModule } from './UnistylesModule'
import { UnistylesRuntime } from './UnistylesRuntime'
import { UnistyleRegistry } from './UnistyleRegistry'
import type { UnistylesBridge } from '../types'
import { UnistylesError, isTest, isWeb } from '../common'
import { UnistylesMockedBridge, UnistylesMockedRegistry, UnistylesMockedRuntime } from './mocks'

class Unistyles {
    private _runtime: UnistylesRuntime
    private _registry: UnistyleRegistry
    private _bridge: UnistylesBridge

    constructor() {
        if (isTest) {
            this._bridge = new UnistylesMockedBridge() as unknown as UnistylesBridge
            this._registry = new UnistylesMockedRegistry(this._bridge) as unknown as UnistyleRegistry
            this._runtime = new UnistylesMockedRuntime(this._bridge, this._registry) as unknown as UnistylesRuntime

            return
        }

        const isInstalled = UnistylesModule?.install() ?? false

        if (!isInstalled) {
            throw new Error(UnistylesError.RuntimeUnavailable)
        }

        // @ts-ignore
        // eslint-disable-next-line no-undef
        this._bridge = (isWeb ? globalThis : global).__UNISTYLES__ as UnistylesBridge
        this._registry = new UnistyleRegistry(this._bridge)
        this._runtime = new UnistylesRuntime(this._bridge, this._registry)
    }

    public get registry() {
        return this._registry
    }

    public get runtime() {
        return this._runtime
    }
}

export const unistyles = new Unistyles()
