import type { UnistylesTheme } from '../types'
import type { UnistylesConfig } from '../specs/StyleSheet'
import type { AppBreakpoint, AppThemeName } from '../specs/types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { UnistylesRuntime } from './runtime'
import { isServer, schemeToTheme } from './utils'
import { UnistylesListener } from './listener'
import { UnistyleDependency } from '../specs/NativePlatform'

class UnistylesStateBuilder {
    themes = new Map<string, UnistylesTheme>()
    themeName?: AppThemeName

    private matchingBreakpoints = new Map<string, boolean>()

    get breakpoint() {
        const [currentBreakpoint] = Array.from(this.matchingBreakpoints)
            .reverse()
            .find(([_key, value]) => value) ?? []

        return currentBreakpoint as AppBreakpoint | undefined
    }

    breakpoints?: UnistylesBreakpoints

    hasAdaptiveThemes = false

    init = (config: UnistylesConfig) => {
        this.initThemes(config.themes)
        this.initBreakpoints(config.breakpoints)
        this.initSettings(config.settings)

        if (isServer()) {
            return
        }

        UnistylesListener.initListeners()
    }

    private initThemes = (themes = {} as UnistylesThemes) => {
        Object.entries(themes).forEach(([themeName, theme]) => {
            this.themes.set(themeName, theme)
        })
    }

    private initSettings = (settings: UnistylesConfig['settings']) => {
        this.hasAdaptiveThemes = settings?.adaptiveThemes ?? false
        const themeNames = Array.from(this.themes.keys()) as Array<AppThemeName>

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
                if (isServer()) {
                    return
                }

                const mediaQuery = window.matchMedia(`(min-width: ${value}px)`)
                this.matchingBreakpoints.set(breakpoint, mediaQuery.matches)

                mediaQuery.addEventListener('change', event => {
                    this.matchingBreakpoints.set(breakpoint, event.matches)
                    UnistylesListener.emitChange(UnistyleDependency.Breakpoints)
                })
            })
    }
}

export const UnistylesState = new UnistylesStateBuilder()
