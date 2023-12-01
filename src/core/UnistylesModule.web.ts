import type { UnistylesThemes, UnistylesBreakpoints } from 'react-native-unistyles'
import type { ColorSchemeName, UnistylesBridge } from '../types'

const getPreferredColorScheme = (): ColorSchemeName => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }

    return 'light'
}

export class UnistylesBridgeWeb implements UnistylesBridge {
    public screenWidth: number = window.innerWidth
    public screenHeight: number = window.innerHeight
    public enabledPlugins: Array<string> = []
    public hasAdaptiveThemes: boolean = false
    public themeName: keyof UnistylesThemes = '' as keyof UnistylesThemes
    public breakpoint: keyof UnistylesBreakpoints = {} as keyof UnistylesBreakpoints
    public colorScheme: ColorSchemeName = getPreferredColorScheme()
    public sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, number]> = []
    public themes: Array<keyof UnistylesThemes> = []

    public useBreakpoints(breakpoints: UnistylesBreakpoints): void {
        this.sortedBreakpointPairs = Object
            .entries(breakpoints)
            .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0)) as Array<[keyof UnistylesBreakpoints, number]>
    }

    public useTheme(name: keyof UnistylesThemes): void {
        this.themeName = name
    }

    public useAdaptiveThemes(enable: boolean): void {
        this.hasAdaptiveThemes = enable
    }

    public addPlugin(pluginName: string, notify: boolean): void {
        this.enabledPlugins = this.enabledPlugins.concat(pluginName)

        if (notify) {
            // todo
        }
    }

    public removePlugin(pluginName: string): void {
        this.enabledPlugins = this.enabledPlugins.filter(name => name !== pluginName)
    }

    public install() {
        // @ts-ignore
        window.__UNISTYLES__ = this

        return true
    }
}

export const UnistylesModule = new UnistylesBridgeWeb()
