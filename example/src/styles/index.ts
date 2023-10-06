import { createUnistyles } from 'react-native-unistyles'
import { breakpoints } from './breakpoints'
import { theme } from './theme'

export const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, typeof theme>(breakpoints)

export {
    theme
}
