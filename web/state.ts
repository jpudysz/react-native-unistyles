import type { UnistylesConfig } from '../src/specs/StyleSheet'
import { createTypeStyle } from 'typestyle'
import { camelToKebab, reduceObject } from './utils'
import type { AppThemeName } from '../src/specs/types'
import type { UnistylesTheme } from '../src/types'
import type { UnistylesBreakpoints } from '../src/global'

class UnistylesStateBuilder {
    themes = new Map<string, UnistylesTheme>()
    private themeStyleTag = document.createElement('style')
    private themesStyleSheet = createTypeStyle(this.themeStyleTag)
    themeName?: AppThemeName

    breakpoints?: UnistylesBreakpoints

    init = (config: UnistylesConfig) => {
        document.head.appendChild(this.themeStyleTag)
        Object.entries(config.themes ?? {}).forEach(([themeName, theme]) => {
            const parsedTheme = reduceObject(theme, (themePropertyValue, themeProperty) => {
                if (themeProperty === 'colors') {
                    const parsedColors = Object.fromEntries(Object.entries(themePropertyValue).map(([colorName, colorValue]) => [`--${String(colorName)}`, colorValue]))

                    this.themesStyleSheet.cssRule(`:root.${themeName}`, parsedColors)

                    return reduceObject(themePropertyValue, (_colorValue, colorName) => `var(--${camelToKebab(String(colorName))})`)
                }

                return themePropertyValue
            })

            this.themes.set(themeName, parsedTheme as UnistylesTheme)
        })

        this.breakpoints = config.breakpoints
        this.themeName = config.settings?.initialTheme ?? this.themes.keys().next().value
        const root = document.querySelector(':root')
        root?.classList.add(this.themeName ?? '')
    }
}

export const UnistylesState = new UnistylesStateBuilder()
