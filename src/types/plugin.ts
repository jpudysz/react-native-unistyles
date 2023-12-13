import type { RNStyle } from './core'
import type { UnistylesRuntime } from '../core'

export type UnistylesPlugin = {
    name: string,
    onParsedStyle?: (styleKey: string, style: RNStyle, runtime: UnistylesRuntime) => RNStyle
}
