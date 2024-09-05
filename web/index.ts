import { create } from './create'
import { UnistylesRuntime } from './runtime'
import { UnistylesState } from './state'
import { StyleSheet as NativeStyleSheet } from 'react-native'

export const StyleSheet = {
    configure: UnistylesState.init,
    create,
    absoluteFill: NativeStyleSheet.absoluteFill,
    compose: NativeStyleSheet.compose,
    flatten: NativeStyleSheet.flatten,
    hairlineWidth: NativeStyleSheet.hairlineWidth
}

export { UnistylesRuntime } from './runtime'
export * from './mock'

export const getSsrUnistyles = () => UnistylesRuntime.getSsrUnistyles()
