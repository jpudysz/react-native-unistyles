import { unistyles } from './core'
import { mq } from './utils'
import { useInitialTheme } from './hooks'
import type { UnistylesPlugin, UnistylesValues } from './types'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'
import { ScreenOrientation, AndroidContentSizeCategory, IOSContentSizeCategory } from './common'
import { useStyles } from './useStyles'
import { createStyleSheet } from './createStyleSheet'

/**
 * Utility to interact with the Unistyles
 * (should be called only once)
 */
const UnistylesRegistry = {
    /**
     * Register themes to be used in the app
     * @param themes - Key value pair of themes
     */
    addThemes: unistyles.registry.addThemes,
    /**
     * Register breakpoints to be used in the app
     * @param breakpoints - Key value pair of breakpoints
     */
    addBreakpoints: unistyles.registry.addBreakpoints,
    /**
     * Register additional config to customize the Unistyles
     * @param config - Key value pair of config
     */
    addConfig: unistyles.registry.addConfig
}

const UnistylesRuntime = unistyles.runtime

export {
    mq,
    useStyles,
    useInitialTheme,
    createStyleSheet,
    ScreenOrientation,
    AndroidContentSizeCategory,
    IOSContentSizeCategory,
    UnistylesRegistry,
    UnistylesRuntime
}

export type {
    UnistylesThemes,
    UnistylesBreakpoints,
    UnistylesPlugin,
    UnistylesValues
}
