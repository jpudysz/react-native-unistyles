import type { UnistylesShadowRegistry as NativeUnistylesShadowRegistry } from '../specs/ShadowRegistry'
import type { StyleSheet as NativeStyleSheet } from '../specs/StyleSheet'
import type { Runtime as NativeUnistylesRuntime } from '../specs/UnistylesRuntime'
import { deepMergeObjects } from '../utils'
import { create } from './create'
import { UnistylesServices } from './services'
import { isServer } from './utils'

declare global {
    // @ts-ignore
    var __unistyles__: UnistylesServices
}

if (isServer() && !globalThis.__unistyles__) {
    // @ts-ignore
    globalThis.__unistyles__ = new UnistylesServices()
}

export const UnistylesWeb = isServer() ? globalThis.__unistyles__ : new UnistylesServices()
export const StyleSheet = {
    configure: UnistylesWeb.state.init,
    create: create,
    absoluteFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    },
    absoluteFillObject: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    },
    compose: (a: object, b: object) => deepMergeObjects(a, b),
    flatten: (styles: Array<object>) => deepMergeObjects(...styles),
    hairlineWidth: 1
} as unknown as typeof NativeStyleSheet

export const UnistylesRuntime = UnistylesWeb.runtime as unknown as typeof NativeUnistylesRuntime
export const UnistylesShadowRegistry = UnistylesWeb.shadowRegistry as unknown as typeof NativeUnistylesShadowRegistry

export * from './mock'

