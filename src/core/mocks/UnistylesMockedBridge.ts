// @ts-nocheck
import type { UnistylesThemes, UnistylesBreakpoints } from '../../global'

export class UnistylesMockedBridge {
    constructor() {}

    public screenWidth() {}
    public screenHeight() {}
    public enabledPlugins() {}
    public hasAdaptiveThemes() {}
    public themeName() {}
    public breakpoint() {}
    public colorScheme() {}
    public contentSizeCategory() {}
    public sortedBreakpointPairs() {}
    public insets() {}
    public statusBar() {}
    public navigationBar() {}
    public themes(themes: Array<keyof UnistylesThemes>) {}
    public useBreakpoints(breakpoints: UnistylesBreakpoints) {}
    public useTheme(name: keyof UnistylesThemes) {}
    public updateTheme(name: keyof UnistylesThemes) {}
    public useAdaptiveThemes(enable: boolean) {}
    public addPlugin(pluginName: string, notify: boolean) {}
    public removePlugin(pluginName: string) {}
}
