import type { UnistylesBridge } from './types'
import type { UnistyleRegistry } from './UnistyleRegistry'
import { UnistylesColorScheme, UnistylesError } from './types'
import type { UnistylesThemes } from './global'

export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private registry: UnistyleRegistry) {
        this.unistylesBridge = unistylesBridge
        this.registry = registry
    }

    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    public get breakpoints() {
        return this.registry.breakpoints
    }

    public get sortedBreakpoints() {
        return this.registry.sortedBreakpointPairs
    }

    public get config() {
        return this.registry.config
    }

    public get theme() {
        const currentTheme = this.unistylesBridge.theme

        if (!currentTheme) {
            throw new Error(UnistylesError.ThemeNotSet)
        }

        return currentTheme
    }

    public get currentBreakpoint() {
        return this.unistylesBridge.breakpoint
    }

    public setColorScheme(scheme: UnistylesColorScheme) {
        if (scheme !== this.colorScheme) {
            this.unistylesBridge.useColorScheme(scheme)
        }
    }

    public setTheme(name: keyof UnistylesThemes) {
        if (!this.registry.isClosed) {
            this.registry.isClosed = true
        }

        if (name !== this.theme && this.hasTheme(name)) {
            this.unistylesBridge.useTheme(name)

            return true
        }

        return false
    }

    public hasTheme(name: keyof UnistylesThemes) {
        return name in this.registry.themes
    }

    public getTheme(forName: keyof UnistylesThemes) {
        if (!this.hasTheme(forName)) {
            throw new Error(UnistylesError.ThemeNotFound)
        }

        return this.registry.themes[forName]
    }
}
