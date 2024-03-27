import { ScreenOrientation, UnistylesError } from '../common'
import type { UnistylesBridge, UnistylesPlugin } from '../types'
import type { UnistylesThemes } from '../global'
import type { UnistyleRegistry } from './UnistyleRegistry'

/**
 * Utility to interact with the Unistyles during runtime
 */
export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private unistylesRegistry: UnistyleRegistry) {}

    /**
     * Get the current color scheme
     * @returns - The current color scheme
     */
    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    /**
     * Get info about adaptive themes
     * @returns - boolean indicating if the adaptive themes are enabled
     */
    public get hasAdaptiveThemes() {
        return this.unistylesBridge.hasAdaptiveThemes
    }

    /**
     * Get the current theme name
     * @returns - The current theme name
     */
    public get themeName() {
        return this.unistylesBridge.themeName
    }

    /**
     * Get the current content size category
     * @returns - The current content size category
     */
    public get contentSizeCategory() {
        return this.unistylesBridge.contentSizeCategory
    }

    /**
     * Get the current breakpoint based on device size
     * @returns - The current breakpoint
     */
    public get breakpoint() {
        return this.unistylesBridge.breakpoint
    }

    /**
     * Get registered breakpoints with UnitylesRegistry
     * @returns - The registered breakpoints
     */
    public get breakpoints() {
        return this.unistylesRegistry.breakpoints
    }

    /**
     * Get the names of currently enabled plugins
     * @returns - The names of currently enabled plugins
     */
    public get enabledPlugins() {
        return this.unistylesBridge.enabledPlugins
    }

    /**
     * Get the screen size
     * @returns - The screen size { width, height }
     */
    public get screen() {
        return {
            width: this.unistylesBridge.screenWidth,
            height: this.unistylesBridge.screenHeight
        }
    }

    /**
     * Get the safe area insets
     * @returns - The safe area insets { top, bottom, left, right }
     */
    public get insets() {
        return this.unistylesBridge.insets
    }

    /**
     * Get the status bar info
     * @returns - The status bar api { width, height, setColor }
     */
    public get statusBar() {
        return {
            width: this.unistylesBridge.statusBar.width,
            height: this.unistylesBridge.statusBar.height,
            setColor: (color?: string) => this.unistylesBridge.statusBar.setColor(color ?? '')
        }
    }

    /**
     * Get the navigation bar info (Android)
     * @returns - The navigation bar api { width, height, setColor }
     */
    public get navigationBar() {
        return {
            width: this.unistylesBridge.navigationBar.width,
            height: this.unistylesBridge.navigationBar.height,
            setColor: (color?: string) => this.unistylesBridge.navigationBar.setColor(color ?? '')
        }
    }

    /**
     * Get the screen orientation
     * @returns - The screen orientation
     */
    public get orientation() {
        const { width, height } = this.screen

        if (width > height) {
            return ScreenOrientation.Landscape
        }

        return ScreenOrientation.Portrait
    }

    /**
     * Switch to a different theme
     * @param name - The name of the theme to switch to
     * @returns - boolean indicating if the theme was switched
     */
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

    /**
     * Update the theme at runtime
     * If current theme is updated, the changes will be applied immediately
     * @param name - The name of the theme to update
     * @param updater - Function that receives the current theme and expect modified theme to be returned
     */
    public updateTheme = (name: keyof UnistylesThemes, updater: (theme: UnistylesThemes[keyof UnistylesThemes]) => UnistylesThemes[keyof UnistylesThemes]) => {
        this.unistylesRegistry.updateTheme(name, updater(this.unistylesRegistry.getTheme(name)))
    }

    /**
     * Enable or disable adaptive themes
     * @param enable - boolean indicating if adaptive themes should be enabled
     */
    public setAdaptiveThemes = (enable: boolean) => {
        this.unistylesBridge.useAdaptiveThemes(enable)
    }

    /**
     * Enable a plugin
     * @param plugin - Plugin that conforms to UnistylesPlugin interface
     */
    public addPlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.addPlugin(plugin)
    }

    /**
     * Disable a plugin
     * @param plugin - Plugin that conforms to UnistylesPlugin interface
     */
    public removePlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.removePlugin(plugin)
    }
}
