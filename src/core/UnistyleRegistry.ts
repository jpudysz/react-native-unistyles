import type { UnistylesBridge, UnistylesConfig, UnistylesPlugin } from '../types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { isDev, isWeb, UnistylesError } from '../common'
import { cssMediaQueriesPlugin, normalizeWebStylesPlugin } from '../plugins'

export class UnistyleRegistry {
    public config: UnistylesConfig = {}
    public plugins: Array<UnistylesPlugin> = isWeb
        ? [normalizeWebStylesPlugin]
        : []
    public themeNames: Array<keyof UnistylesThemes> = []
    public themes: UnistylesThemes = {} as UnistylesThemes
    public breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]> = []

    constructor(private unistylesBridge: UnistylesBridge) {}

    public addThemes = (themes: UnistylesThemes) => {
        this.themes = themes

        const keys = Object.keys(themes) as Array<keyof UnistylesThemes>

        this.unistylesBridge.themes = keys
        this.themeNames = keys

        return {
            addBreakpoints: this.addBreakpoints,
            addConfig: this.addConfig
        }
    }

    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => {
        this.breakpoints = breakpoints
        this.unistylesBridge.useBreakpoints(breakpoints)
        this.sortedBreakpointPairs = this.unistylesBridge.sortedBreakpointPairs

        return {
            addThemes: this.addThemes,
            addConfig: this.addConfig
        }
    }

    public addConfig = (config: UnistylesConfig) => {
        this.config = config

        if (config.adaptiveThemes) {
            this.unistylesBridge.useAdaptiveThemes(config.adaptiveThemes)
        }

        if (config.plugins) {
            config.plugins.forEach(plugin => this.addPlugin(plugin, false))
        }

        if (config.initialTheme) {
            this.unistylesBridge.useTheme(config.initialTheme)
        }

        if (config.experimentalCSSMediaQueries) {
            this.plugins = [cssMediaQueriesPlugin].concat(this.plugins)
            this.unistylesBridge.addPlugin(cssMediaQueriesPlugin.name, false)
        }

        return {
            addBreakpoints: this.addBreakpoints,
            addThemes: this.addThemes
        }
    }

    public getTheme = (forName: keyof UnistylesThemes) => {
        if (this.themeNames.length === 0) {
            return {} as UnistylesThemes[keyof UnistylesThemes]
        }

        if (this.hasTheme(forName)) {
            return this.themes[forName]
        }

        if (this.unistylesBridge.themeName) {
            throw new Error(UnistylesError.ThemeNotFound)
        }

        throw new Error(UnistylesError.ThemeNotSelected)
    }

    public addPlugin = (plugin: UnistylesPlugin, notify: boolean = true) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.InvalidPluginName)
        }

        const isAlreadyRegistered = this.plugins.some(({ name }) => name === plugin.name)

        if (!isAlreadyRegistered) {
            this.plugins = [plugin].concat(this.plugins)
            this.unistylesBridge.addPlugin(plugin.name, notify)

            return
        }

        if (!isDev) {
            throw new Error(UnistylesError.DuplicatePluginName)
        }
    }

    public removePlugin = (plugin: UnistylesPlugin) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.CantRemoveInternalPlugin)
        }

        this.plugins = this.plugins.filter(({ name }) => name !== plugin.name)
        this.unistylesBridge.removePlugin(plugin.name)
    }

    public updateTheme = (name: keyof UnistylesThemes, theme: UnistylesThemes[keyof UnistylesThemes]) => {
        this.themes[name] = theme

        if (this.unistylesBridge.themeName === name) {
            this.unistylesBridge.updateTheme(name)
        }
    }

    public hasTheme = (name: keyof UnistylesThemes) => name in this.themes
}
