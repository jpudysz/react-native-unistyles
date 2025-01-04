import { UnistyleDependency } from '../specs/NativePlatform'
import { ColorScheme, Orientation, type AppTheme, type AppThemeName } from '../specs/types'
import type { UnistylesMiniRuntime } from '../specs/UnistylesRuntime'
import { WebContentSizeCategory } from '../types'
import { NavigationBar, StatusBar } from './mock'
import { error, isServer, schemeToTheme } from './utils'
import type { UnistylesServices } from './types'

export class UnistylesRuntime {
    lightMedia = this.getLightMedia()
    darkMedia = this.getDarkMedia()

    constructor(private services: UnistylesServices) {}

    private getLightMedia(): MediaQueryList | null {
        if (isServer()) {
            return null
        }

        if (!this.lightMedia) {
            this.lightMedia = window.matchMedia('(prefers-color-scheme: light)')
        }

        return this.lightMedia
    }

    private getDarkMedia(): MediaQueryList | null {
        if (isServer()) {
            return null
        }

        if (!this.darkMedia) {
            this.darkMedia = window.matchMedia('(prefers-color-scheme: dark)')
        }

        return this.darkMedia
    }

    get colorScheme() {
        switch (true) {
            case this.getLightMedia()?.matches:
                return ColorScheme.Light
            case this.getDarkMedia()?.matches:
                return ColorScheme.Dark
            default:
                return ColorScheme.Unspecified
        }
    }

    get themeName() {
        if (this.services.state.hasAdaptiveThemes) {
            return schemeToTheme(this.colorScheme) as AppThemeName
        }

        return this.services.state.themeName
    }

    get contentSizeCategory() {
        return WebContentSizeCategory.Unspecified
    }

    get breakpoints() {
        return this.services.state.breakpoints ?? {}
    }

    get breakpoint() {
        return this.services.state.breakpoint
    }

    get orientation() {
        if (isServer()) {
            return Orientation.Portrait
        }

        return screen.orientation.type.includes('portrait') ? Orientation.Portrait : Orientation.Landscape
    }

    get theme() {
        return this.getTheme(this.themeName)
    }

    get pixelRatio() {
        return isServer() ? 1 : window.devicePixelRatio
    }

    get screen() {
        if (isServer()) {
            return {
                width: 0,
                height: 0
            }
        }

        return {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }

    get fontScale() {
        return 1
    }

    get insets() {
        return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            ime: 0
        }
    }

    get statusBar() {
        return StatusBar
    }

    get rtl() {
        return isServer() ? true : document.documentElement.dir === 'rtl'
    }

    get hasAdaptiveThemes() {
        return this.services.state.hasAdaptiveThemes
    }

    get navigationBar() {
        return NavigationBar
    }

    get miniRuntime(): UnistylesMiniRuntime {
        return {
            colorScheme: this.colorScheme,
            themeName: this.themeName,
            contentSizeCategory: this.contentSizeCategory,
            breakpoint: this.breakpoint,
            isLandscape: this.orientation === Orientation.Landscape,
            isPortrait: this.orientation === Orientation.Portrait,
            pixelRatio: this.pixelRatio,
            screen: this.screen,
            fontScale: this.fontScale,
            insets: this.insets,
            statusBar: {
                width: this.statusBar.width,
                height: this.statusBar.height
            },
            navigationBar: {
                width: this.navigationBar.width,
                height: this.navigationBar.height,
            },
            rtl: this.rtl,
            hasAdaptiveThemes: this.hasAdaptiveThemes
        }
    }

    setTheme = (themeName: AppThemeName) => {
        if (this.hasAdaptiveThemes) {
            throw error(`You're trying to set theme to: '${themeName}', but adaptiveThemes are enabled.`)
        }

        if (themeName === this.themeName) {
            return
        }

        const oldTheme = this.services.state.themeName

        this.services.state.themeName = themeName
        this.services.listener.emitChange(UnistyleDependency.Theme)
        this.services.listener.emitChange(UnistyleDependency.ThemeName)

        if (!isServer() && !this.services.state.hasAdaptiveThemes && this.services.state.CSSVars) {
            const root = document.querySelector(':root')

            root?.classList.remove(oldTheme ?? '')
            root?.classList.add(themeName ?? '')
        }
    }

    setAdaptiveThemes = (isEnabled: boolean) => {
        this.services.state.hasAdaptiveThemes = isEnabled

        if (!isEnabled) {
            document.querySelector(':root')?.classList.add(this.themeName ?? '')

            return
        }

        document.querySelector(':root')?.classList.remove(this.themeName ?? '')
        this.setTheme(schemeToTheme(this.colorScheme) as AppThemeName)
    }

    setRootViewBackgroundColor = (color: string) => {
        if (isServer()) {
            return
        }

        document.documentElement.style.backgroundColor = color
    }

    setImmersiveMode = () => {}

    updateTheme = (themeName: AppThemeName, updater: (currentTheme: AppTheme) => AppTheme) => {
        const oldTheme = this.services.state.themes.get(themeName)

        if (!oldTheme) {
            throw error(`Unistyles: You're trying to update theme "${themeName}" but it wasn't registered.`)
        }

        this.services.state.themes.set(themeName, updater(oldTheme))
    }

    getTheme = (themeName = this.themeName, CSS = false) => {
        const theme = CSS
            ? this.services.state.cssThemes.get(themeName ?? '')
            : this.services.state.themes.get(themeName ?? '')

        if (!themeName || !theme) {
            throw error(`You're trying to get theme "${themeName}" but it wasn't registered.`)
        }

        return theme
    }
}
