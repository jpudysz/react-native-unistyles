import { unistyles } from './core'
import { mq } from './utils'
import { useInitialTheme } from './hooks'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'
import { ScreenOrientation } from './common'
import { useStyles } from './useStyles'
import { createStyleSheet } from './createStyleSheet'

const { addThemes, addBreakpoints, addConfig  } = unistyles.registry
const UnistylesRuntime = unistyles.runtime
const UnistylesRegistry = {
    addThemes,
    addBreakpoints,
    addConfig
}

export const __dangerouslyUnregister = unistyles.registry.dangerouslyUnregister

export {
    UnistylesRuntime,
    UnistylesRegistry
}

export {
    mq,
    useInitialTheme,
    useStyles,
    createStyleSheet,
    ScreenOrientation
}

export type {
    UnistylesThemes,
    UnistylesBreakpoints
}
