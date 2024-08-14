export class UnistylesMockedRegistry {
    unistylesBridge;
    config = {};
    breakpoints = {};
    sortedBreakpointPairs = [];
    plugins = [];
    themes = {};
    themeNames = [];
    constructor(unistylesBridge) {
        this.unistylesBridge = unistylesBridge;
    }
    addThemes = (themes) => {
        this.themes = themes;
        this.themeNames = Object.keys(themes);
        return this;
    };
    addBreakpoints = (breakpoints) => {
        this.breakpoints = breakpoints;
        this.sortedBreakpointPairs = Object
            .entries(breakpoints)
            .sort((breakpoint1, breakpoint2) => {
            const [, value1] = breakpoint1;
            const [, value2] = breakpoint2;
            return value1 - value2;
        });
        return this;
    };
    addConfig = (config) => { };
    getTheme = (forName) => {
        if (this.themeNames.length === 0) {
            return {};
        }
        return this.themes[forName];
    };
    addPlugin = (plugin, notify = true) => { };
    removePlugin = (plugin) => { };
    updateTheme = (name, theme) => { };
    hasTheme = (name) => true;
}
