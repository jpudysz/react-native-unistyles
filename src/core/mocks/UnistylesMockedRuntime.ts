// @ts-nocheck
import { ScreenOrientation } from '../../common'
import type { UnistylesBridge, UnistylesPlugin } from '../../types'
import type { UnistylesThemes } from '../../global'
import type { UnistylesMockedRegistry } from './UnistylesMockedRegistry'
import type { UnistyleRegistry } from '../UnistyleRegistry'

export class UnistylesMockedRuntime {
    private unistylesRegistry: UnistylesMockedRegistry

    constructor(private unistylesBridge: UnistylesBridge, private unistylesRegistry: UnistyleRegistry) {
        this.unistylesRegistry = unistylesRegistry as unknown as UnistylesMockedRegistry
    }

    public get colorScheme() {
        return 'dark'
    }

    public get hasAdaptiveThemes() {
        return true
    }

    public get themeName() {
        return this.unistylesRegistry.themeNames.length > 0
            ? this.unistylesRegistry.themeNames.at(0)
            : undefined
    }

    public get contentSizeCategory() {
        return 'unspecified'
    }

    public get breakpoint() {
        if (this.unistylesRegistry.sortedBreakpointPairs.length === 0) {
            return undefined
        }

        const firstBreakpoint = this.unistylesRegistry.sortedBreakpointPairs.at(0)

        return firstBreakpoint
            ? firstBreakpoint.at(0)
            : undefined
    }

    public get breakpoints() {
        return this.unistylesRegistry.breakpoints
    }

    public get enabledPlugins() {
        return this.unistylesRegistry.plugins
    }

    public get screen() {
        return {
            width: 360,
            height: 800
        }
    }

    public get insets() {
        return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    }

    public get statusBar() {
        return {
            height: 24,
            width: 800,
            setColor: () => {}
        }
    }

    public get navigationBar() {
        return {
            height: 0,
            width: 0,
            setColor: () => {}
        }
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
