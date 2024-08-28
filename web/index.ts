import { create } from './create'
import { UnistylesRuntime } from './runtime'

export const StyleSheet = {
    configure: UnistylesRuntime.init,
    create
}

export { UnistylesRuntime }
