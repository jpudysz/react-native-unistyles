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

    public addThemes = (themes: UnistylesThemes) => this
    public addBreakpoints = (breakpoints: UnistylesBreakpoints) => this
    public addConfig = (config: UnistylesConfig) => this
    public getTheme = (forName: keyof UnistylesThemes) => ({} as UnistylesThemes[keyof UnistylesThemes])
    public addPlugin = (plugin: UnistylesPlugin, notify: boolean = true) => {}
    public removePlugin = (plugin: UnistylesPlugin) => {}
    public updateTheme = (name: keyof UnistylesThemes, theme: UnistylesThemes[keyof UnistylesThemes]) => {}
    public hasTheme = (name: keyof UnistylesThemes) => true
}
