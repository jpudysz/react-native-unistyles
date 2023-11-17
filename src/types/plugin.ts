import type { RNStyle } from './core'
import type { UnistylesRuntime } from '../core'

export type UnistylesPlugin = {
    onParsedStyle?: (styleKey: string, style: RNStyle, runtime: UnistylesRuntime) => RNStyle
}
