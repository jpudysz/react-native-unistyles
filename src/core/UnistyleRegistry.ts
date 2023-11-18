import type { UnistylesBridge, UnistylesConfig, UnistylesPlugin } from '../types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'
import { UnistylesError } from '../common'

export class UnistyleRegistry {
    public config: UnistylesConfig = {}
    public plugins: Array<UnistylesPlugin> = []
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

        return this
    }

    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => {
        this.breakpoints = breakpoints
        this.unistylesBridge.useBreakpoints(breakpoints)
        this.sortedBreakpointPairs = this.unistylesBridge.sortedBreakpointPairs

        return this
    }

    public addConfig = (config: UnistylesConfig) => {
        this.config = config

        if (config.adaptiveThemes) {
            this.unistylesBridge.useAdaptiveThemes(config.adaptiveThemes)
        }

        if (config.experimentalPlugins) {
            config.experimentalPlugins.forEach(plugin => this.addPlugin(plugin, false))
        }

        if (config.initialTheme) {
            this.unistylesBridge.useTheme(config.initialTheme)
        }
    }

    public addPlugin = (plugin: UnistylesPlugin, notify: boolean = true) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.InvalidPluginName)
        }

        if (this.plugins.some(({ name }) => name === plugin.name)) {
            throw new Error(UnistylesError.DuplicatePluginName)
        }

        this.plugins = this.plugins.concat([plugin])
        this.unistylesBridge.addPlugin(plugin.name, notify)
    }

    public removePlugin = (plugin: UnistylesPlugin) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.CantRemoveInternalPlugin)
        }

        this.plugins = this.plugins.filter(({ name }) => name !== plugin.name)
        this.unistylesBridge.removePlugin(plugin.name)
    }
}
