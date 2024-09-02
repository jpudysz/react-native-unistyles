import type { UnistylesConfig } from '../src/specs/StyleSheet'
import { createTypeStyle } from 'typestyle'
import { camelToKebab, reduceObject } from './utils'
import type { AppBreakpoint, AppThemeName } from '../src/specs/types'
import type { UnistylesTheme } from '../src/types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../src/global'

class UnistylesStateBuilder {
    themes = new Map<string, UnistylesTheme>()
    private themeStyleTag = document.createElement('style')
    private themesStyleSheet = createTypeStyle(this.themeStyleTag)
    themeName?: AppThemeName

    breakpoint?: AppBreakpoint
    breakpoints?: UnistylesBreakpoints

    hasAdaptiveThemes = false

    init = (config: UnistylesConfig) => {
        this.initThemes(config.themes)
        this.initBreakpoints(config.breakpoints)
        this.themeName = config.settings?.initialTheme ?? this.themes.keys().next().value
        this.hasAdaptiveThemes = config.settings?.adaptiveThemes ?? false
        document.querySelector(':root')?.classList.add(this.themeName ?? '')
    }

    private initThemes = (themes = {} as UnistylesThemes) => {
        document.head.appendChild(this.themeStyleTag)
        Object.entries(themes).forEach(([themeName, theme]) => {
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
    }

    private initBreakpoints = (breakpoints = {} as UnistylesBreakpoints) => {
        this.breakpoints = breakpoints
        Object.entries(breakpoints)
            .sort(([, a], [, b]) => a - b)
            .forEach(([breakpoint, value]) => {
                const mediaQuery = window.matchMedia(`(min-width: ${value}px)`)

                if (mediaQuery.matches) {
                    this.breakpoint = breakpoint as AppBreakpoint
                }

                mediaQuery.addEventListener('change', (event) => {
                    if (!event.matches) {
                        return
                    }

                    this.breakpoint = breakpoint as AppBreakpoint
                })
            })

    }
}

export const UnistylesState = new UnistylesStateBuilder()
