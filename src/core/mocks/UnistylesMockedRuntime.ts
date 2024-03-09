// @ts-nocheck
import { ScreenOrientation } from '../../common'
import type { UnistylesBridge, UnistylesPlugin, UnistylesRegistry } from '../../types'
import type { UnistylesThemes } from '../../global'

export class UnistylesMockedRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private unistylesRegistry: UnistylesRegistry) {}

    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    public get hasAdaptiveThemes() {
        return this.unistylesBridge.hasAdaptiveThemes
    }

    public get themeName() {
        return this.unistylesBridge.themeName
    }

    public get contentSizeCategory() {
        return this.unistylesBridge.contentSizeCategory
    }

    public get breakpoint() {
        return this.unistylesBridge.breakpoint
    }

    public get breakpoints() {
        return this.unistylesRegistry.breakpoints
    }

    public get enabledPlugins() {
        return this.unistylesBridge.enabledPlugins
    }

    public get screen() {
        return {
            width: this.unistylesBridge.screenWidth,
            height: this.unistylesBridge.screenHeight
        }
    }

    public get insets() {
        return this.unistylesBridge.insets
    }

    public get statusBar() {
        return this.unistylesBridge.statusBar
    }

    public get navigationBar() {
        return this.unistylesBridge.navigationBar
    }

    public get orientation() {
        return ScreenOrientation.Portrait
    }

    public setTheme = (name: keyof UnistylesThemes) => true
    public updateTheme = (name: keyof UnistylesThemes, theme: UnistylesThemes[keyof UnistylesThemes]) => {}
    public setAdaptiveThemes = (enabled: boolean) => {}
    public addPlugin = (plugin: UnistylesPlugin) => {}
    public removePlugin = (plugin: UnistylesPlugin) => {}
}
