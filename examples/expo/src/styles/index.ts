import { createUnistyles } from 'react-native-unistyles'
import { breakpoints } from './breakpoints'
import type { AppTheme } from './theme'
import { lightTheme, darkTheme, premiumTheme } from './theme'

export const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, AppTheme>(breakpoints)

export {
    lightTheme,
    darkTheme,
    premiumTheme,
    breakpoints
}

export type {
    AppTheme
}
