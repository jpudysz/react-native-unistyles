// @ts-nocheck
import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { UnistylesPlugin, UnistylesConfig, UnistylesBridge } from '../../types'

export class UnistylesMockedRegistry {
    public config: UnistylesConfig = {}
    public breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]> = []
    public plugins: Array<UnistylesPlugin> = []
    public themes: UnistylesThemes = {} as UnistylesThemes
    public themeNames: Array<keyof UnistylesThemes> = []

    constructor(private unistylesBridge: UnistylesBridge) {}

    public addThemes = (themes: UnistylesThemes) => {
        this.themes = themes
        this.themeNames = Object.keys(themes) as Array<keyof UnistylesThemes>

        return this
    }
    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => {
        this.breakpoints = breakpoints
        this.sortedBreakpointPairs = Object
            .entries(breakpoints)
            .sort((breakpoint1, breakpoint2) => {
                const [, value1] = breakpoint1
                const [, value2] = breakpoint2

                return value1 - value2
            }) as Array<[keyof UnistylesBreakpoints, UnistylesBreakpoints[keyof UnistylesBreakpoints]]>

        return this
    }
    public addConfig = (config: UnistylesConfig) => {}
    public getTheme = (forName: keyof UnistylesThemes) => {
        if (this.themeNames.length === 0) {
            return {} as UnistylesThemes[keyof UnistylesThemes]
        }

        return this.themes[forName]
    }

    public addPlugin = (plugin: UnistylesPlugin, notify: boolean = true) => {}
    public removePlugin = (plugin: UnistylesPlugin) => {}
    public updateTheme = (name: keyof UnistylesThemes, theme: UnistylesThemes[keyof UnistylesThemes]) => {}
    public hasTheme = (name: keyof UnistylesThemes) => true
}
