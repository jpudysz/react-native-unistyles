import { ScreenOrientation, UnistylesError } from '../common'
import type { UnistylesBridge, UnistylesPlugin } from '../types'
import type { UnistylesThemes } from '../global'
import type { UnistyleRegistry } from './UnistyleRegistry'

export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private unistylesRegistry: UnistyleRegistry) {}

    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    public get hasAdaptiveThemes() {
        return this.unistylesBridge.hasAdaptiveThemes
    }

    public get themeName() {
        return this.unistylesBridge.themeName
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

    public get orientation() {
        const { width, height } = this.screen

        if (width > height) {
            return ScreenOrientation.Landscape
        }

        return ScreenOrientation.Portrait
    }

    public setTheme = (name: keyof UnistylesThemes) => {
        if (name === this.themeName) {
            return
        }

        if (this.unistylesRegistry.hasTheme(name)) {
            this.unistylesBridge.useTheme(name)

            return true
        }

        throw new Error(UnistylesError.ThemeNotRegistered)
    }

    public setAdaptiveThemes = (enable: boolean) => {
        this.unistylesBridge.useAdaptiveThemes(enable)
    }

    public addPlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.addPlugin(plugin)
    }

    public removePlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.removePlugin(plugin)
    }
}
