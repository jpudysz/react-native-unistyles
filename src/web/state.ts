import type { UnistylesTheme } from '../types'
import type { UnistylesConfig } from '../specs/StyleSheet'
import type { AppBreakpoint, AppTheme, AppThemeName } from '../specs/types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { UnistylesRuntime } from './runtime'
import { error, isServer, schemeToTheme } from './utils'
import { UnistylesListener } from './listener'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { UnionToIntersection } from '../types'

type UnistylesSettings = Partial<UnionToIntersection<Required<UnistylesConfig>['settings']>>

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

        if (config.settings) {
            this.initSettings(config.settings as UnistylesSettings)
        }

        if (isServer()) {
            return
        }

        UnistylesListener.initListeners()
    }

    private initThemes = (themes = {} as UnistylesThemes) => {
        Object.entries(themes).forEach(([themeName, theme]) => {
            this.themes.set(themeName, theme as AppTheme)
        })
    }

    private initSettings = (settings: UnistylesSettings) => {
        this.hasAdaptiveThemes = settings?.adaptiveThemes ?? false

        if (settings.initialTheme && settings.adaptiveThemes) {
            throw error('You\'re trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.')
        }

        // Adaptive themes
        if (settings.adaptiveThemes) {
            if (!this.themes.get('light') || !this.themes.get('dark')) {
                throw error("You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.")
            }

            this.themeName = schemeToTheme(UnistylesRuntime.colorScheme) as AppThemeName

            return
        }

        if (settings.initialTheme) {
            const initialTheme = typeof settings.initialTheme === 'function'
                ? settings.initialTheme()
                : settings.initialTheme

            if (!this.themes.get(initialTheme)) {
                throw error(`You're trying to select theme "${initialTheme}" but it wasn't registered.`)
            }

            this.themeName = initialTheme
        }
    }

    private initBreakpoints = (breakpoints = {} as UnistylesBreakpoints) => {
        this.breakpoints = breakpoints
        const breakpointsEntries = Object.entries(breakpoints)

        if (breakpointsEntries.length === 0) {
            throw error('StyleSheet.configure\'s breakpoints can\'t be empty.')
        }

        if (breakpointsEntries?.[0]?.[1] !== 0) {
            throw error('StyleSheet.configure\'s first breakpoint must start from 0.')
        }

        breakpointsEntries
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
