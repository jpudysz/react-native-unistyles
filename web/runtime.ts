import { ColorScheme, Orientation, type AppTheme, type AppThemeName } from '../src/specs/types'
import { WebContentSizeCategory } from '../src/types'
import { NavigationBar, StatusBar } from './mock'
import { UnistylesState } from './state'
import { hexToRGBA, schemeToTheme } from './utils'

class UnistylesRuntimeBuilder {
    private readonly lightMedia = window.matchMedia('(prefers-color-scheme: light)')
    private readonly darkMedia = window.matchMedia('(prefers-color-scheme: dark)')

    get colorScheme() {
        switch (true) {
            case this.lightMedia.matches:
                return ColorScheme.Light
            case this.darkMedia.matches:
                return ColorScheme.Dark
            default:
                return ColorScheme.Unspecified
        }
    }

    get themeName() {
        return UnistylesState.themeName
    }

    get contentSizeCategory() {
        return WebContentSizeCategory.Unspecified
    }

    get breakpoint() {
        return UnistylesState.breakpoint
    }

    get orientation() {
        return screen.orientation.type.includes('portrait') ? Orientation.Portrait : Orientation.Landscape
    }

    get theme() {
        if (!this.themeName) {
            throw new Error('🦄 No theme selected!')
        }

        const theme = UnistylesState.themes.get(this.themeName)

        if (!theme) {
            throw new Error(`🦄 Theme "${this.themeName}" is not registered!`)
        }

        return theme
    }

    get pixelRatio() {
        return window.devicePixelRatio
    }

    get screen() {
        return {
            width: screen.width,
            height: screen.height
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
        return document.documentElement.dir === 'rtl'
    }

    get hasAdaptiveThemes() {
        return UnistylesState.hasAdaptiveThemes
    }

    get navigationBar() {
        return NavigationBar
    }

    get miniRuntime() {
        return {
            colorScheme: this.colorScheme,
            themeName: this.themeName,
            contentSizeCategory: this.contentSizeCategory,
            breakpoint: this.breakpoint,
            orientation: this.orientation,
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
            hasAdaptiveThemes: this.hasAdaptiveThemes,
        }
    }

    setTheme = (themeName: AppThemeName) => {
        document.querySelector(':root')?.classList.replace(UnistylesRuntime.themeName ?? '', themeName)
        UnistylesState.themeName = themeName
    }

    setAdaptiveThemes = (isEnabled: boolean) => {
        UnistylesState.hasAdaptiveThemes = isEnabled

        if (!isEnabled) {
            return
        }

        this.setTheme(schemeToTheme(UnistylesRuntime.colorScheme))
    }

    setRootViewBackgroundColor = (hex: string, alpha?: number) => {
        document.documentElement.style.backgroundColor = alpha ? hexToRGBA(hex, alpha) : hex
    }

    setImmersiveMode = () => {}

    updateTheme = (themeName: AppThemeName, updater: (currentTheme: AppTheme) => AppTheme) => {
        const oldTheme = UnistylesState.rawThemes ? UnistylesState.rawThemes[themeName] : undefined

        if (!oldTheme || !UnistylesState.rawThemes) {
            throw new Error(`🦄 Theme "${themeName}" is not registered!`)
        }

        UnistylesState.rawThemes[themeName] = updater(oldTheme)
        UnistylesState.updateThemes()
    }
}

export const UnistylesRuntime = new UnistylesRuntimeBuilder()
