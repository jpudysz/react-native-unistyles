// Plain data, shared by unistyles.ts and the e2e host (keep it free of React Native imports)

const palette = {
    white: '#ffffff',
    black: '#000000',
    ink: '#1b1b1f',
    paper: '#f5f5f7',
    slate: '#333333',
    mist: '#eeeeee'
}

// Chips repeat the coincidence from #1192: dark `fill` equals light `subtle`,
// dark `onFill` equals light `onSubtle`, so a toggle after a theme change asks React for a value it already rendered
export const lightTheme = {
    colors: {
        background: palette.paper,
        surface: palette.white,
        typography: palette.ink,
        muted: '#6b6b76',
        accent: '#ff6b6b',
        primary: '#3498db',
        secondary: '#1dd1a1',
        border: '#d0d0d8',
        chip: {
            fill: '#3498db',
            subtle: '#dfe6ee',
            onFill: palette.white,
            onSubtle: palette.slate
        },
        steps: ['#1abc9c', '#e67e22', '#9b59b6']
    },
    gap: (v: number) => v * 8
}

export const darkTheme = {
    colors: {
        background: palette.black,
        surface: '#1c1c1e',
        typography: palette.white,
        muted: '#a0a0aa',
        accent: '#ff9ff3',
        primary: '#341f97',
        secondary: '#10ac84',
        border: '#3a3a3c',
        chip: {
            fill: '#dfe6ee',
            subtle: '#2c2c30',
            onFill: palette.slate,
            onSubtle: palette.mist
        },
        steps: ['#16a085', '#d35400', '#8e44ad']
    },
    gap: (v: number) => v * 8
}

export const premiumTheme = {
    colors: {
        background: '#ff9ff3',
        surface: '#ffd1f7',
        typography: '#76278f',
        muted: '#a55eae',
        accent: '#000000',
        primary: '#c0392b',
        secondary: '#2980b9',
        border: '#e58ad8',
        chip: {
            fill: '#76278f',
            subtle: '#f7c6ef',
            onFill: palette.white,
            onSubtle: '#76278f'
        },
        steps: ['#27ae60', '#f39c12', '#2c3e50']
    },
    gap: (v: number) => v * 8
}

export const themes = {
    light: lightTheme,
    dark: darkTheme,
    premium: premiumTheme
}

export type ThemeName = keyof typeof themes

export const THEME_NAMES = Object.keys(themes) as Array<ThemeName>

export const breakpoints = {
    xs: 0,
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200
}
