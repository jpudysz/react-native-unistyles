import type { UnistylesConfig } from '../src/specs/StyleSheet'
import { createTypeStyle } from 'typestyle'
import { camelToKebab, reduceObject, schemeToTheme } from './utils'
import type { AppBreakpoint, AppThemeName } from '../src/specs/types'
import type { UnistylesTheme } from '../src/types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../src/global'
import { UnistylesRuntime } from './runtime'

class UnistylesStateBuilder {
    rawThemes?: UnistylesThemes
    themes = new Map<string, UnistylesTheme>()
    private themeStyleTag = document.createElement('style')
    private themesStyleSheet = createTypeStyle(this.themeStyleTag)
    themeName?: AppThemeName

    breakpoint?: AppBreakpoint
    breakpoints?: UnistylesBreakpoints

    hasAdaptiveThemes = false

    init = (config: UnistylesConfig) => {
        this.rawThemes = config.themes
        this.updateThemes()

        this.initBreakpoints(config.breakpoints)

        this.initSettings(config.settings)

        document.head.appendChild(this.themeStyleTag)
        document.querySelector(':root')?.classList.add(this.themeName ?? '')
    }

    updateThemes = () => {
        this.themesStyleSheet.reinit()
        Object.entries(this.rawThemes ?? {}).forEach(([themeName, theme]) => {
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

    private initSettings = (settings: UnistylesConfig['settings']) => {
        this.hasAdaptiveThemes = settings?.adaptiveThemes ?? false
        const themeNames = Object.keys(this.rawThemes ?? {}) as Array<AppThemeName>

        // Single theme + no settings
        if (!settings?.adaptiveThemes && !settings?.initialTheme && themeNames.length === 1) {
            this.themeName = themeNames[0]

            return
        }

        // No settings
        if (!settings?.adaptiveThemes && !settings?.initialTheme) {
            throw new Error('🦄 You need to specify either "initialTheme" or "adaptiveThemes" in your config')
        }

        // Adaptive themes
        if (settings.adaptiveThemes) {
            this.themeName = schemeToTheme(UnistylesRuntime.colorScheme)

            return
        }

        // Initial theme
        this.themeName = typeof settings.initialTheme === 'function' ? settings.initialTheme() : settings.initialTheme
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
