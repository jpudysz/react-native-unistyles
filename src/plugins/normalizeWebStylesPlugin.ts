import type { UnistylesPlugin } from '../types'
import { normalizeStyle } from './normalizer'

export const normalizeWebStylesPlugin: UnistylesPlugin = {
    onParsedStyle: (_key, styles) => normalizeStyle(styles)
}
