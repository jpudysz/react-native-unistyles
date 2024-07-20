import { ScreenOrientation, UnistylesError } from '../common'
import type { Color, UnistylesBridge, UnistylesPlugin } from '../types'
import type { UnistylesThemes } from '../global'
import type { UnistyleRegistry } from './UnistyleRegistry'
import { parseColor } from '../utils/parseColor'

/**
 * Utility to interact with the Unistyles during runtime
 */
export class UnistylesRuntime {
    constructor(private unistylesBridge: UnistylesBridge, private unistylesRegistry: UnistyleRegistry) {}

    /**
     * Get the mini runtime injected to creteStyleSheet
     * @returns - The mini runtime
     */
    public get miniRuntime() {
        return {
            contentSizeCategory: this.contentSizeCategory,
            breakpoint: this.breakpoint,
            screen: this.screen,
            insets: this.insets,
            statusBar: {
                width: this.statusBar.width,
                height: this.statusBar.height
            },
            navigationBar: {
                width: this.navigationBar.width,
                height: this.navigationBar.height
            },
            orientation: this.orientation,
            pixelRatio: this.pixelRatio,
            fontScale: this.fontScale,
            hairlineWidth: this.hairlineWidth,
            rtl: this.rtl
        }
    }

    /**
     * Get the current color scheme
     * @returns - The current color scheme
     */
    public get colorScheme() {
        return this.unistylesBridge.colorScheme
    }

    /**
     * Get the layout direction
     * @returns - Boolean indicating if the layout direction is RTL
     */
    public get rtl() {
        return this.unistylesBridge.rtl
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
     * @deprecated - Plugins will be removed in the next major release
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
     * @returns - The status bar api { width, height, setColor, setHidden }
     */
    public get statusBar() {
        return {
            width: this.unistylesBridge.statusBar.width,
            height: this.unistylesBridge.statusBar.height,
            setColor: (color?: Color, alpha?: number) => {
                const [parsedColor, parsedAlpha] = parseColor(color, alpha)

                this.unistylesBridge.statusBar.setColor(parsedColor, parsedAlpha)
            },
            setHidden: (hidden: boolean) => this.unistylesBridge.statusBar.setHidden(hidden)
        }
    }

    /**
     * Get the navigation bar info (Android)
     * @returns - The navigation bar api { width, height, setColor, setHidden }
     */
    public get navigationBar() {
        return {
            width: this.unistylesBridge.navigationBar.width,
            height: this.unistylesBridge.navigationBar.height,
            setColor: (color?: Color, alpha?: number) => {
                const [parsedColor, parsedAlpha] = parseColor(color, alpha)

                this.unistylesBridge.navigationBar.setColor(parsedColor, parsedAlpha)
            },
            setHidden: (hidden: boolean) => this.unistylesBridge.navigationBar.setHidden(hidden)
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
     * Get the pixel ratio
     * @returns - The pixel ratio
     */
    public get pixelRatio() {
        return this.unistylesBridge.pixelRatio
    }

    /**
     * Get the font scale
     * @returns - The font scale
     */
    public get fontScale() {
        return parseFloat(this.unistylesBridge.fontScale.toFixed(2))
    }

    /**
     * Get the hairline width
     * @returns - The thinnest width of the platform
     */
    public get hairlineWidth() {
        const pixelRatio = this.pixelRatio
        const nearestPixel = Math.trunc(pixelRatio * 0.4) || 1

        return nearestPixel / pixelRatio
    }

    /**
     * Get the immersive mode (both status bar and navigation bar hidden (Android))
     * @param isEnabled
     */
    public setImmersiveMode(isEnabled: boolean) {
        return this.unistylesBridge.setImmersiveMode(isEnabled)
    }

    /**
     * Set the root view background color
     * @param color - The color to set
     * @param alpha - Color alpha - default is 1
     */
    public setRootViewBackgroundColor = (color?: Color, alpha?: number) => {
        const [parsedColor, parsedAlpha] = parseColor(color, alpha)

        this.unistylesBridge.setRootViewBackgroundColor(parsedColor, parsedAlpha)
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
     * @deprecated - Plugins will be removed in the next major release
     * @param plugin - Plugin that conforms to UnistylesPlugin interface
     */
    public addPlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.addPlugin(plugin)
    }

    /**
     * Disable a plugin
     * @deprecated - Plugins will be removed in the next major release
     * @param plugin - Plugin that conforms to UnistylesPlugin interface
     */
    public removePlugin = (plugin: UnistylesPlugin) => {
        this.unistylesRegistry.removePlugin(plugin)
    }
}
