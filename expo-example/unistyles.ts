import { StyleSheet } from 'react-native-unistyles'

// https://material-foundation.github.io/material-theme-builder/

const lightTheme = {
    colors: {
        primary: '#6D5E0F',
        surfaceTint: '#6D5E0F',
        onPrimary: '#FFFFFF',
        primaryContainer: '#F8E287',
        onPrimaryContainer: '#534600',
        secondary: '#665E40',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#EEE2BC',
        onSecondaryContainer: '#4E472A',
        tertiary: '#43664E',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#C5ECCE',
        onTertiaryContainer: '#2C4E38',
        error: '#BA1A1A',
        onError: '#FFFFFF',
        errorContainer: '#FFDAD6',
        onErrorContainer: '#93000A',
        background: '#FFF9EE',
        onBackground: '#1E1B13',
        surface: '#FFF9EE',
        onSurface: '#1E1B13',
        surfaceVariant: '#EAE2D0',
        onSurfaceVariant: '#4B4739',
        outline: '#7C7767',
        outlineVariant: '#CDC6B4',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#333027',
        inverseOnSurface: '#F7F0E2',
        inversePrimary: '#DBC66E',
        primaryFixed: '#F8E287',
        onPrimaryFixed: '#221B00',
        primaryFixedDim: '#DBC66E',
        onPrimaryFixedVariant: '#534600',
        secondaryFixed: '#EEE2BC',
        onSecondaryFixed: '#211B04',
        secondaryFixedDim: '#D1C6A1',
        onSecondaryFixedVariant: '#4E472A',
        tertiaryFixed: '#C5ECCE',
        onTertiaryFixed: '#00210F',
        tertiaryFixedDim: '#A9D0B3',
        onTertiaryFixedVariant: '#2C4E38',
        surfaceDim: '#E0D9CC',
        surfaceBright: '#FFF9EE',
        surfaceContainerLowest: '#FFFFFF',
        surfaceContainerLow: '#FAF3E5',
        surfaceContainer: '#F4EDDF',
        surfaceContainerHigh: '#EEE8DA',
        surfaceContainerHighest: '#E8E2D4',
    },
    gap: (v: number) => v * 8
}

const darkTheme = {
    colors: {
        primary: '#DBC66E',
        surfaceTint: '#DBC66E',
        onPrimary: '#3A3000',
        primaryContainer: '#534600',
        onPrimaryContainer: '#F8E287',
        secondary: '#D1C6A1',
        onSecondary: '#363016',
        secondaryContainer: '#4E472A',
        onSecondaryContainer: '#EEE2BC',
        tertiary: '#A9D0B3',
        onTertiary: '#143723',
        tertiaryContainer: '#2C4E38',
        onTertiaryContainer: '#C5ECCE',
        error: '#FFB4AB',
        onError: '#690005',
        errorContainer: '#93000A',
        onErrorContainer: '#FFDAD6',
        background: '#15130B',
        onBackground: '#E8E2D4',
        surface: '#15130B',
        onSurface: '#E8E2D4',
        surfaceVariant: '#4B4739',
        onSurfaceVariant: '#CDC6B4',
        outline: '#969080',
        outlineVariant: '#4B4739',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#E8E2D4',
        inverseOnSurface: '#333027',
        inversePrimary: '#6D5E0F',
        primaryFixed: '#F8E287',
        onPrimaryFixed: '#221B00',
        primaryFixedDim: '#DBC66E',
        onPrimaryFixedVariant: '#534600',
        secondaryFixed: '#EEE2BC',
        onSecondaryFixed: '#211B04',
        secondaryFixedDim: '#D1C6A1',
        onSecondaryFixedVariant: '#4E472A',
        tertiaryFixed: '#C5ECCE',
        onTertiaryFixed: '#00210F',
        tertiaryFixedDim: '#A9D0B3',
        onTertiaryFixedVariant: '#2C4E38',
        surfaceDim: '#15130B',
        surfaceBright: '#3C3930',
        surfaceContainerLowest: '#100E07',
        surfaceContainerLow: '#1E1B13',
        surfaceContainer: '#222017',
        surfaceContainerHigh: '#2D2A21',
        surfaceContainerHighest: '#38352B',
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
        dark: darkTheme
    }
})

