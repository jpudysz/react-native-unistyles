import { ColorScheme, Orientation, type AppThemeName } from '../src/specs/types'
import { IOSContentSizeCategory } from '../src/types'
import { UnistylesState } from './state'

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
        return IOSContentSizeCategory.Unspecified
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
        return {
            width: 0,
            height: 0
        }
    }

    get rtl() {
        return false
    }

    get hasAdaptiveThemes() {
        return UnistylesState.hasAdaptiveThemes
    }

    get navigationBar() {
        return {
            width: 0,
            height: 0,
        }
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
            statusBar: this.statusBar,
            rtl: this.rtl,
            hasAdaptiveThemes: this.hasAdaptiveThemes,
            navigationBar: this.navigationBar
        }
    }

    setTheme = (themeName: AppThemeName) => {
        document.querySelector(':root')?.classList.replace(UnistylesRuntime.themeName ?? '', themeName)
        UnistylesState.themeName = themeName
    }
}

export const UnistylesRuntime = new UnistylesRuntimeBuilder()
