import type { UnistylesBridge, UnistylesConfig } from './types'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'

export class UnistyleRegistry {
    public config: UnistylesConfig = {}
    public themes: UnistylesThemes = {} as UnistylesThemes
    public breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]> = []

    constructor(private unistylesBridge: UnistylesBridge) {}

    public addThemes = (themes: UnistylesThemes) => {
        this.themes = themes
        this.unistylesBridge.themes = Object.keys(themes) as Array<keyof UnistylesThemes>

        return this
    }

    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => {
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
