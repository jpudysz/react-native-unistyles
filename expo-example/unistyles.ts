import { StyleSheet } from 'react-native-unistyles'

const sharedColors = {
    barbie: '#ff9ff3',
    oak: '#1dd1a1',
    sky: '#48dbfb',
    fog: '#c8d6e5',
    aloes: '#00d2d3',
    blood: '#ff6b6b'
}

const lightTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#ffffff',
        typography: '#000000',
        accent: sharedColors.blood
    },
    gap: (v: number) => v * 8
}

const darkTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#000000',
        typography: '#ffffff',
        accent: sharedColors.barbie
    },
    gap: (v: number) => v * 8
}

const premiumTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: sharedColors.barbie,
        typography: '#76278f',
        accent: '#000000'
    },
    gap: (v: number) => v * 8
}

const breakpoints = {
    xs: 0,
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200
}

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
        adaptiveThemes: true
    },
    breakpoints,
    themes: {
        light: lightTheme,
        dark: darkTheme,
        premium: premiumTheme
    }
})

