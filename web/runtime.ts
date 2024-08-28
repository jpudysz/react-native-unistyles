import type { UnistylesConfig } from '../src/specs/StyleSheet'
import { createTypeStyle, media } from 'typestyle'
import { reduceObject } from './utils'
import type { AppThemeName } from '../src/specs/types'
import type { UnistylesTheme } from '../src/types'

class UnistylesRuntimeBuilder {
    private themes = new Map<string, UnistylesTheme>()
    private themeStyleTag = document.createElement('style')
    private themesStyleSheet = createTypeStyle(this.themeStyleTag)
    private themeName?: AppThemeName

    init = (config: UnistylesConfig) => {
        document.head.appendChild(this.themeStyleTag)

        Object.entries(config.themes ?? {}).forEach(([themeName, theme]) => {
            const parsedTheme = reduceObject(theme, (themePropertyValue, themeProperty) => {
                if (themeProperty === 'colors') {
                    const parsedColors = Object.fromEntries(Object.entries(themePropertyValue).map(([colorName, colorValue]) => [`--${String(colorName)}`, colorValue]))

                    switch (themeName) {
                        case 'light':
                        case 'dark':
                            this.themesStyleSheet.cssRule(':root', media({ prefersColorScheme: themeName }, parsedColors))

                            break
                        default:
                            this.themesStyleSheet.cssRule(`:root.${themeName}`, parsedColors)

                            break
                    }

                    return reduceObject(themePropertyValue, (_colorValue, colorName) => `var(--${String(colorName)})`)
                }

                return themePropertyValue
            })

            this.themes.set(themeName, parsedTheme as UnistylesTheme)
        })

        this.themeName = this.themes.keys().next().value
    }

    get theme() {
        if (!this.themeName) {
            throw new Error('🦄 No theme selected!')
        }

        const theme = this.themes.get(this.themeName)

        if (!theme) {
            throw new Error(`🦄 Theme "${this.themeName}" is not registered!`)
        }

        return theme
    }
}

export const UnistylesRuntime = new UnistylesRuntimeBuilder()
