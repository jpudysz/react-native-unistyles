import { create } from './create'
import { UnistylesState } from './state'
import { deepMergeObjects } from '../utils'
import type { CreateUnistylesStyleSheet } from '../types'

export const StyleSheet = {
    configure: UnistylesState.init,
    create: create as CreateUnistylesStyleSheet,
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
    hairlineWidth: 1 as number
}

export { UnistylesRuntime } from './runtime'
export { UnistylesShadowRegistry } from './shadowRegistry'
export * from './mock'
