import type { UnistylesBridge, UnistylesConfig } from './types'
import type { UnistylesThemes, UnistylesBreakpoints } from './global'
import { UnistylesError } from './types'

export class UnistyleRegistry {
    public isClosed = false
    public themes: UnistylesThemes = {} as UnistylesThemes
    public breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]> = []
    public config: UnistylesConfig = {}

    constructor(private unistylesBridge: UnistylesBridge) {
        this.unistylesBridge = unistylesBridge
    }

    public addThemes(themes: UnistylesThemes) {
        if (this.isClosed) {
            throw new Error(UnistylesError.RegistryClosed)
        }

        this.themes = themes
        this.unistylesBridge.registerThemes(Object.keys(themes))

        return this
    }

    public addBreakpoints(breakpoints: UnistylesBreakpoints) {
        if (this.isClosed) {
            throw new Error(UnistylesError.RegistryClosed)
        }

        this.unistylesBridge.registerBreakpoints(breakpoints)
        this.sortedBreakpointPairs = this.unistylesBridge.sortedBreakpointPairs

        return this
    }

    public addConfig(config: UnistylesConfig) {
        if (this.isClosed) {
            throw new Error(UnistylesError.RegistryClosed)
        }

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
