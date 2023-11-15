import { unistyles } from './core'
import { mq } from './utils'
import { useInitialTheme } from './hooks'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'
import { ScreenOrientation } from './common'
import { useStyles } from './useStyles'
import { createStyleSheet } from './createStyleSheet'

const UnistylesRegistry = {
    addThemes: unistyles.registry.addThemes,
    addBreakpoints: unistyles.registry.addBreakpoints,
    addConfig: unistyles.registry.addConfig
}

const UnistylesRuntime = unistyles.runtime

export {
    mq,
    useStyles,
    useInitialTheme,
    createStyleSheet,
    ScreenOrientation,
    UnistylesRegistry,
    UnistylesRuntime
}

export type {
    UnistylesThemes,
    UnistylesBreakpoints
}
