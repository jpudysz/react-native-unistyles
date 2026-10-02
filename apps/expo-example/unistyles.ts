import { StyleSheet } from 'react-native-unistyles'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from './themes'

type AppBreakpoints = typeof breakpoints
type AppThemes = {
    light: typeof lightTheme
    dark: typeof darkTheme
    premium: typeof premiumTheme
}

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}

    export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
    settings: {
        initialTheme: 'light'
    },
    breakpoints,
    themes: {
        light: lightTheme,
        dark: darkTheme,
        premium: premiumTheme
    }
})
