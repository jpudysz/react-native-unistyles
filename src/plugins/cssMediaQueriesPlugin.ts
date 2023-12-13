// prevent recursive import
import { createMediaQueryForStyles } from '../utils/cssMediaQuery'
import type { UnistylesPlugin } from '../types'

export const cssMediaQueriesPlugin: UnistylesPlugin = {
    name: '__unistylesCSSMediaQueries',
    onParsedStyle: (_key, styles, runtime) => createMediaQueryForStyles(styles, runtime)
}
