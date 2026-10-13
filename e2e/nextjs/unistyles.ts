import { StyleSheet } from 'react-native-unistyles'

const lightTheme = {
    colors: { background: '#ffffff', text: '#111111' },
}

type AppThemes = { light: typeof lightTheme }

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
    themes: { light: lightTheme },
    settings: { initialTheme: 'light' },
})
