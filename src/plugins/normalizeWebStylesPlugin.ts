import type { UnistylesPlugin } from '../types'
import { normalizeStyle } from '../normalizer'

export const normalizeWebStylesPlugin: UnistylesPlugin = {
    name: '__unistylesNormalizeWebStyles',
    onParsedStyle: (_key, styles) => normalizeStyle(styles)
}
