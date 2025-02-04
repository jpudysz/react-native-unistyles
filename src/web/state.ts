import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { UnistyleDependency } from '../specs/NativePlatform'
import type { UnistylesConfig } from '../specs/StyleSheet'
import type { AppBreakpoint, AppTheme, AppThemeName } from '../specs/types'
import type { UnistylesTheme } from '../types'
import type { UnionToIntersection } from '../types'
import type { UnistylesServices } from './types'
import { error, hyphenate, isServer, schemeToTheme } from './utils'

type UnistylesSettings = Partial<UnionToIntersection<Required<UnistylesConfig>['settings']>>

export class UnistylesState {
    isInitialized = false
    themes = new Map<string, UnistylesTheme>()
    cssThemes = new Map<string, UnistylesTheme>()
    themeName?: AppThemeName
    CSSVars = true

    private matchingBreakpoints = new Map<string, boolean>()

    get breakpoint() {
        const [currentBreakpoint] =
            Array.from(this.matchingBreakpoints)
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

        this.isInitialized = true
        this.initThemes(config.themes, config.settings?.CSSVars)
        this.initBreakpoints(config.breakpoints)

        if (config.settings) {
            this.initSettings(config.settings as UnistylesSettings)
        }

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

    private initThemes = (themes = {} as UnistylesThemes, CSSVars = true) => {
        this.CSSVars = CSSVars

        Object.entries(themes).forEach(([themeName, theme]) => {
            this.themes.set(themeName, theme as AppTheme)

            if (CSSVars) {
                this.services.registry.css.addTheme(themeName, theme)

                const convertTheme = (key: string, value: any, prev = '-'): [string, any] => {
                    if (typeof value === 'object' && value !== null) {
                        return [
                            key,
                            Object.fromEntries(
                                Object.entries(value).map(([nestedKey, nestedValue]) =>
                                    convertTheme(nestedKey, nestedValue, `${prev}-${key}`),
                                ),
                            ),
                        ]
                    }

                    if (typeof value === 'string') {
                        return [key, `var(${prev}-${hyphenate(key)})`]
                    }

                    return [key, value]
                }

                this.cssThemes.set(
                    themeName,
                    Object.fromEntries(
                        Object.entries(theme).map(([key, value]) => {
                            return convertTheme(key, value)
                        }),
                    ) as UnistylesTheme,
                )
            }
        })
    }

    private initSettings = (settings: UnistylesSettings) => {
        this.hasAdaptiveThemes = settings?.adaptiveThemes ?? false

        if (settings.initialTheme && settings.adaptiveThemes) {
            throw error(
                "You're trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.",
            )
        }

        // Adaptive themes
        if (settings.adaptiveThemes) {
            if (!this.themes.get('light') || !this.themes.get('dark')) {
                throw error(
                    `You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.`,
                )
            }

            this.themeName = schemeToTheme(this.services.runtime.colorScheme) as AppThemeName

            return
        }

        if (settings.initialTheme) {
            const initialTheme =
                typeof settings.initialTheme === 'function' ? settings.initialTheme() : settings.initialTheme

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
            throw error("StyleSheet.configure's breakpoints can't be empty.")
        }

        if (breakpointsEntries?.[0]?.[1] !== 0) {
            throw error("StyleSheet.configure's first breakpoint must start from 0.")
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
}
