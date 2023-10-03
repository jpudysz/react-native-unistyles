import { createUnistyles } from 'react-native-unistyles'
import { breakpoints } from './breakpoints'
import { theme } from './theme'

export const { useStyles, createStyles } = createUnistyles<typeof breakpoints, typeof theme>(breakpoints)

export {
    theme
}
