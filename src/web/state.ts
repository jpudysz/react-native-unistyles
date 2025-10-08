import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { UnistylesConfig } from '../specs/StyleSheet'
import type { AppBreakpoint, AppTheme, AppThemeName } from '../specs/types'
import type { UnistylesTheme } from '../types'
import type { UnionToIntersection } from '../types'
import type { UnistylesServices } from './types'
import { convertTheme, error, isServer, schemeToTheme } from './utils'

type RemoveNevers<T> = { [K in keyof T as T[K] extends (never | undefined) ? never : K]: T[K] }
type UnistylesSettings = Partial<UnionToIntersection<RemoveNevers<Required<UnistylesConfig>['settings']>>>

export class UnistylesState {
    isInitialized = false
    themes = new Map<string, UnistylesTheme>()
    cssThemes = new Map<string, UnistylesTheme>()
    themeName?: AppThemeName
    CSSVars = true

    private matchingBreakpoints = new Map<string, boolean>()
    private _config: UnistylesConfig = {}

    get breakpoint() {
        const [currentBreakpoint] = Array.from(this.matchingBreakpoints)
            .reverse()
            .find(([_key, value]) => value) ?? []

        return currentBreakpoint as AppBreakpoint | undefined
    }

    breakpoints?: UnistylesBreakpoints

    hasAdaptiveThemes = false

    constructor(private services: UnistylesServices) {}

    init = (config: UnistylesConfig) => {
        if (this.isInitialized) {
            return
        }

        this._config = config
        this.isInitialized = true
        this.initThemes(config.themes, config.settings?.CSSVars)
        this.initBreakpoints(config.breakpoints)
        this.initSettings(config.settings as UnistylesSettings | undefined)

        if (isServer()) {
            return
        }

        // Ensure we have a themeName before calling this
        // classList.add throws a "SyntaxError" DOMException if one of the arguments is an empty string.
        if (!this.hasAdaptiveThemes && this.CSSVars && this.themeName) {
            document.querySelector(':root')?.classList.add(this.themeName)
        }

        this.services.listener.initListeners()
    }

    private initThemes = (themes?: UnistylesThemes, CSSVars = true) => {
        if (!themes) {
            return
        }

        this.CSSVars = CSSVars

        Object.entries(themes).forEach(([themeName, theme]) => {
            this.themes.set(themeName, theme as AppTheme)

            if (CSSVars) {
                this.services.registry.css.addTheme(themeName, theme)
                this.cssThemes.set(
                    themeName,
                    Object.fromEntries(Object.entries(theme).map(([key, value]) => {
                        return convertTheme(key, value)
                    })) as UnistylesTheme
                )
            }
        })
    }

    private initSettings = (settings?: UnistylesSettings) => {
        this.hasAdaptiveThemes = settings?.adaptiveThemes ?? false

        if (settings?.initialTheme && settings.adaptiveThemes) {
            throw error('You\'re trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.')
        }

        // Adaptive themes
        if (settings?.adaptiveThemes) {
            if (!this.themes.get('light') || !this.themes.get('dark')) {
                throw error(`You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.`)
            }

            this.themeName = schemeToTheme(this.services.runtime.colorScheme) as AppThemeName

            return
        }

        if (settings?.initialTheme) {
            const initialTheme = typeof settings.initialTheme === 'function'
                ? settings.initialTheme()
                : settings.initialTheme

            if (!this.themes.get(initialTheme)) {
                throw error(`You're trying to select theme "${initialTheme}" but it wasn't registered.`)
            }

            this.themeName = initialTheme

            return
        }

        if (this.themes.size === 1) {
            this.themeName = this.themes.keys().next().value as UnistylesTheme
        }
    }

    private initBreakpoints = (breakpoints?: UnistylesBreakpoints) => {
        if (!breakpoints) {
            return
        }

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
                    this.services.listener.emitChange(UnistyleDependency.Breakpoints)
                })
            })
    }

    getConfig = () => this._config
}
