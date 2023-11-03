import { unistyles } from './Unistyles'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'
import { ScreenOrientation } from './types'

export { useInitialTheme } from './useInitialTheme'

export { useStyles } from './useStyles'
export { createStyleSheet } from './createStyleSheet'

const { addThemes, addBreakpoints, addConfig  } = unistyles.registry
const UnistylesRuntime = unistyles.runtime
const UnistylesRegistry = {
    addThemes,
    addBreakpoints,
    addConfig
}

export {
    UnistylesRuntime,
    UnistylesRegistry
}

export {
    ScreenOrientation
}

export type {
    UnistylesThemes,
    UnistylesBreakpoints
}
