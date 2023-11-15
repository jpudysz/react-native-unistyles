import type { UnistylesBridge, UnistylesConfig } from '../types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'

export class UnistyleRegistry {
    public config: UnistylesConfig = {}
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

        return this
    }
}
