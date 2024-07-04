import { UnistylesModule } from './UnistylesModule'
import { UnistylesRuntime } from './UnistylesRuntime'
import { UnistyleRegistry } from './UnistyleRegistry'
import { UnistylesStyleSheet } from './StyleSheet'
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

        // todo example implementation POC
        // @ts-ignore
        // eslint-disable-next-line no-undef
        global.__UNISTYLES__GET_SELECTED_THEME__ = (themeName: string) => {
            console.log(themeName)

            return {
                colors: {
                    backgroundColor: '#ffffff',
                    typography: '#000000',
                    accent: '#ff9ff3'
                },
                gap: (x: number) => x * 8
            }
        }
    }

    public get registry() {
        return this._registry
    }

    public get runtime() {
        return this._runtime
    }

    public get styleSheet() {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        return global.__UNISTYLES__STYLESHEET__ as UnistylesStyleSheet
    }
}

export const unistyles = new Unistyles()
