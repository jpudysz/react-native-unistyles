// @ts-nocheck
import type { UnistylesThemes, UnistylesBreakpoints } from '../../global'

export class UnistylesMockedBridge {
    constructor() {}

    public get screenWidth() {
        return 400
    }

    public get screenHeight() {
        return 860
    }

    public get enabledPlugins() {
        return []
    }

    public get hasAdaptiveThemes() {
        return true
    }

    public get themeName() {
        return 'default'
    }

    public get breakpoint() {
        return 'sm'
    }

    public get colorScheme() {
        return 'dark'
    }

    public get contentSizeCategory() {
        return 'unspecified'
    }

    public get sortedBreakpointPairs() {
        return [['sm', 320], ['md', 480], ['lg', 640], ['xl', 800]]
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
            height: 20,
            width: 400
        }
    }

    public get navigationBar() {
        return {
            height: 0,
            width: 0
        }
    }

    public set themes(themes: Array<keyof UnistylesThemes>) {}
    public useBreakpoints(breakpoints: UnistylesBreakpoints) {}
    public useTheme(name: keyof UnistylesThemes) {}
    public updateTheme(name: keyof UnistylesThemes) {}
    public useAdaptiveThemes(enable: boolean) {}
    public addPlugin(pluginName: string, notify: boolean) {}
    public removePlugin(pluginName: string) {}
}
