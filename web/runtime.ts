import type { MiniRuntime } from '../src/specs'
import type { AppThemeName } from '../src/specs/types'
import { UnistylesState } from './state'

class UnistylesRuntimeBuilder {
    get themeName() {
        return UnistylesState.themeName
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

    get miniRuntime() {
        return {
            themeName: this.themeName
        } as MiniRuntime
    }

    setTheme = (themeName: AppThemeName) => {
        const root = document.querySelector(':root')

        root?.classList.replace(UnistylesRuntime.themeName ?? '', themeName)
        UnistylesState.themeName = themeName
    }
}

export const UnistylesRuntime = new UnistylesRuntimeBuilder()
