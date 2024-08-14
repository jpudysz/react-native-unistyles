import { UnistylesModule } from './UnistylesModule';
import { UnistylesRuntime } from './UnistylesRuntime';
import { UnistyleRegistry } from './UnistyleRegistry';
import { UnistylesError, isTest, isWeb } from '../common';
import { UnistylesMockedBridge, UnistylesMockedRegistry, UnistylesMockedRuntime } from './mocks';
class Unistyles {
    _runtime;
    _registry;
    _bridge;
    constructor() {
        if (isTest) {
            this._bridge = new UnistylesMockedBridge();
            this._registry = new UnistylesMockedRegistry(this._bridge);
            this._runtime = new UnistylesMockedRuntime(this._bridge, this._registry);
            return;
        }
        const isInstalled = UnistylesModule?.install() ?? false;
        if (!isInstalled) {
            throw new Error(UnistylesError.RuntimeUnavailable);
        }
        // @ts-ignore
        this._bridge = (isWeb ? globalThis : global).__UNISTYLES__;
        this._registry = new UnistyleRegistry(this._bridge);
        this._runtime = new UnistylesRuntime(this._bridge, this._registry);
        // todo example implementation POC
        // @ts-ignore
        global.__UNISTYLES__GET_SELECTED_THEME__ = (themeName) => {
            console.log(themeName);
            return {
                colors: {
                    backgroundColor: '#ffffff',
                    typography: '#000000',
                    accent: '#ff9ff3'
                },
                gap: (x) => x * 8
            };
        };
    }
    get registry() {
        return this._registry;
    }
    get runtime() {
        return this._runtime;
    }
    get styleSheet() {
        // @ts-ignore
        return global.__UNISTYLES__STYLESHEET__;
    }
}
export const unistyles = new Unistyles();
