import { ScreenOrientation, UnistylesError } from '../common'
import type { UnistylesBridge } from '../types'
import type { UnistylesThemes } from '../global'
import type { UnistyleRegistry } from './UnistyleRegistry'

export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private registry: UnistyleRegistry) {}

    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    public get hasAdaptiveThemes() {
        return this.unistylesBridge.hasAdaptiveThemes
    }

    public get sortedBreakpoints() {
        return this.registry.sortedBreakpointPairs
    }

    public get themeName() {
        return this.unistylesBridge.themeName
    }

    public get breakpoint() {
        return this.unistylesBridge.breakpoint
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
        if (name !== this.themeName && this.hasTheme(name)) {
            this.unistylesBridge.useTheme(name)

            return true
        }

        throw new Error(UnistylesError.ThemeNotRegistered)
    }

    public getTheme = (forName: keyof UnistylesThemes) => {
        if (this.registry.themeNames.length === 0) {
            return {} as UnistylesThemes[keyof UnistylesThemes]
        }

        if (!this.hasTheme(forName)) {
            throw new Error(UnistylesError.ThemeNotFound)
        }

        return this.registry.themes[forName]
    }

    public setAdaptiveThemes = (enable: boolean) => {
        this.unistylesBridge.useAdaptiveThemes(enable)
    }

    private hasTheme = (name: keyof UnistylesThemes) => name in this.registry.themes
}
