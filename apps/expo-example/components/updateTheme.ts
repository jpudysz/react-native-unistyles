import { UnistylesRuntime } from 'react-native-unistyles'
import { themes, type ThemeName } from '../themes'

const ACCENTS = ['#e84393', '#00b894', '#fdcb6e', '#0984e3']

let accentIndex = 0

// updateTheme mutates the registered theme, every themed node follows
export const shuffleAccent = () => {
    accentIndex = (accentIndex + 1) % ACCENTS.length

    UnistylesRuntime.updateTheme(UnistylesRuntime.themeName as ThemeName, theme => ({
        ...theme,
        colors: {
            ...theme.colors,
            accent: ACCENTS[accentIndex]!
        }
    }))
}

export const restoreThemes = () => {
    (Object.keys(themes) as Array<ThemeName>).forEach(themeName => {
        UnistylesRuntime.updateTheme(themeName, () => themes[themeName])
    })
}
