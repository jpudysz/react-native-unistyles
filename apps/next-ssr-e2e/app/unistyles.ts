import { StyleSheet } from 'react-native-unistyles'

type AppTheme = {
    colors: {
        background: string
        cascadeCard: string
        clientCard: string
        clientCardLabel: string
        text: string
    }
}

const lightTheme: AppTheme = {
    colors: {
        background: '#ffffff',
        cascadeCard: '#c2410c',
        clientCard: '#112233',
        clientCardLabel: '#ffffff',
        text: '#111111',
    },
}

const darkTheme: AppTheme = {
    colors: {
        background: '#111111',
        cascadeCard: '#0e7490',
        clientCard: '#ddeeff',
        clientCardLabel: '#111111',
        text: '#ffffff',
    },
}

type AppThemes = {
    light: typeof lightTheme
    dark: typeof darkTheme
}

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
    themes: {
        dark: darkTheme,
        light: lightTheme,
    },
    settings: {
        CSSVars: false,
        initialTheme: 'light',
    },
})
