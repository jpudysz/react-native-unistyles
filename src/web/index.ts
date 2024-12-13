import { create } from './create'
import { UnistylesState } from './state'
import { deepMergeObjects } from '../utils'
import type { StyleSheet as NativeStyleSheet } from '../specs/StyleSheet'
import { UnistylesRuntime as UnistylesRuntimeWeb } from './runtime'
import type { Runtime as NativeUnistylesRuntime } from '../specs/UnistylesRuntime'

export const StyleSheet = {
    configure: UnistylesState.init,
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
    flatten: (...styles: Array<object>) => deepMergeObjects(...styles),
    hairlineWidth: 1
} as unknown as typeof NativeStyleSheet

export const UnistylesRuntime = UnistylesRuntimeWeb as unknown as typeof NativeUnistylesRuntime

export * from './mock'
export * from './shadowRegistry'
