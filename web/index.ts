import { create } from './create'
import { UnistylesRuntime } from './runtime'
import { UnistylesState } from './state'

export const StyleSheet = {
    configure: UnistylesState.init,
    create
}

export { UnistylesRuntime }
