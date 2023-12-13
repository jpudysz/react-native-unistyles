import { createUnistyles } from 'old-unistyles'
import { breakpoints, type lightTheme } from '../styles'

export const {
    createStyleSheet,
    useStyles
} = createUnistyles<typeof breakpoints, typeof lightTheme>(breakpoints)
