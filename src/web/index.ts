import { StyleSheet as RNStyleSheet } from 'react-native'

import type { UnistylesShadowRegistry as NativeUnistylesShadowRegistry } from '../specs/ShadowRegistry'
import type { StyleSheet as NativeStyleSheet } from '../specs/StyleSheet'
import type { Runtime as NativeUnistylesRuntime } from '../specs/UnistylesRuntime'

import { create } from './create'
import * as unistyles from './services'

export const StyleSheet = {
    configure: unistyles.services.state.init,
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
        bottom: 0,
    },
    compose: (a: object, b: object) => RNStyleSheet.compose(a, b),
    flatten: (...styles: Array<object>) => RNStyleSheet.flatten(...styles),
    hairlineWidth: 1,
} as unknown as typeof NativeStyleSheet

export const UnistylesRuntime = unistyles.services.runtime as unknown as typeof NativeUnistylesRuntime
export const UnistylesShadowRegistry = unistyles.services
    .shadowRegistry as unknown as typeof NativeUnistylesShadowRegistry

export * from './mock'
