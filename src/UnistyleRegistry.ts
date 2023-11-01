import type { UnistylesBridge, UnistylesConfig } from './types'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'

export class UnistyleRegistry {
    public isClosed = false
    public themes: UnistylesThemes = {} as UnistylesThemes
    public breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]> = []
    public config: UnistylesConfig = {}

    constructor(private unistylesBridge: UnistylesBridge) {}

    public addThemes = (themes: UnistylesThemes) => {
        this.themes = themes

        return this
    }

    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => {
        this.unistylesBridge.useBreakpoints(breakpoints)
        this.sortedBreakpointPairs = this.unistylesBridge.sortedBreakpointPairs

        return this
    }

    public addConfig = (config: UnistylesConfig) => {
        this.config = config

        if (config.featureFlags && config.featureFlags.length > 0) {
            this.unistylesBridge.useFeatureFlags(config.featureFlags)
        }

        if (config.colorScheme) {
            this.unistylesBridge.useColorScheme(config.colorScheme)
        }

        return this
    }
}
