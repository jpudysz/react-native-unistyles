import type { UnistylesBridge } from './types'
import type { UnistyleRegistry } from './UnistyleRegistry'
import { ScreenOrientation, UnistylesColorScheme, UnistylesError } from './types'
import type { UnistylesThemes } from './global'

export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private registry: UnistyleRegistry) {}

    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    public get sortedBreakpoints() {
        return this.registry.sortedBreakpointPairs
    }

    public get theme() {
        return this.unistylesBridge.theme
    }

    public get currentBreakpoint() {
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

    public setColorScheme = (scheme: UnistylesColorScheme) => {
        if (scheme !== this.colorScheme) {
            this.unistylesBridge.useColorScheme(scheme)
        }
    }

    public setTheme = (name: keyof UnistylesThemes) => {
        if (name !== this.theme && this.hasTheme(name)) {
            this.unistylesBridge.useTheme(name)

            return true
        }

        return false
    }

    public getTheme = (forName: keyof UnistylesThemes) => {
        if (!this.hasTheme(forName)) {
            throw new Error(UnistylesError.ThemeNotFound)
        }

        return this.registry.themes[forName]
    }

    private hasTheme = (name: keyof UnistylesThemes) => name in this.registry.themes
}
