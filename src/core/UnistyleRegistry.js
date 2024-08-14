import { isDev, isWeb, UnistylesError } from '../common';
import { cssMediaQueriesPlugin, normalizeWebStylesPlugin } from '../plugins';
export class UnistyleRegistry {
    unistylesBridge;
    config = {};
    plugins = isWeb
        ? [normalizeWebStylesPlugin]
        : [];
    themeNames = [];
    themes = {};
    breakpoints = {};
    sortedBreakpointPairs = [];
    constructor(unistylesBridge) {
        this.unistylesBridge = unistylesBridge;
    }
    addThemes = (themes) => {
        this.themes = themes;
        const keys = Object.keys(themes);
        this.unistylesBridge.themes = keys;
        this.themeNames = keys;
        return {
            addBreakpoints: this.addBreakpoints,
            addConfig: this.addConfig
        };
    };
    addBreakpoints = (breakpoints) => {
        this.breakpoints = breakpoints;
        this.unistylesBridge.useBreakpoints(breakpoints);
        this.sortedBreakpointPairs = this.unistylesBridge.sortedBreakpointPairs;
        return {
            addThemes: this.addThemes,
            addConfig: this.addConfig
        };
    };
    addConfig = (config) => {
        this.config = config;
        if (config.adaptiveThemes) {
            this.unistylesBridge.useAdaptiveThemes(config.adaptiveThemes);
        }
        if (config.plugins) {
            config.plugins.forEach(plugin => this.addPlugin(plugin, false));
        }
        if (config.initialTheme) {
            this.unistylesBridge.useTheme(config.initialTheme);
        }
        if (config.experimentalCSSMediaQueries) {
            this.plugins = [cssMediaQueriesPlugin].concat(this.plugins);
            this.unistylesBridge.addPlugin(cssMediaQueriesPlugin.name, false);
        }
        if (isWeb && config.windowResizeDebounceTimeMs !== undefined) {
            this.unistylesBridge.setWindowResizeDebounceTimeMs(config.windowResizeDebounceTimeMs);
        }
        return {
            addBreakpoints: this.addBreakpoints,
            addThemes: this.addThemes
        };
    };
    getTheme = (forName) => {
        if (this.themeNames.length === 0) {
            return {};
        }
        if (this.hasTheme(forName)) {
            return this.themes[forName];
        }
        if (this.unistylesBridge.themeName) {
            throw new Error(UnistylesError.ThemeNotFound);
        }
        throw new Error(UnistylesError.ThemeNotSelected);
    };
    addPlugin = (plugin, notify = true) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.InvalidPluginName);
        }
        const isAlreadyRegistered = this.plugins.some(({ name }) => name === plugin.name);
        if (!isAlreadyRegistered) {
            this.plugins = [plugin].concat(this.plugins);
            this.unistylesBridge.addPlugin(plugin.name, notify);
            return;
        }
        if (!isDev) {
            throw new Error(UnistylesError.DuplicatePluginName);
        }
    };
    removePlugin = (plugin) => {
        if (plugin.name.startsWith('__unistyles')) {
            throw new Error(UnistylesError.CantRemoveInternalPlugin);
        }
        this.plugins = this.plugins.filter(({ name }) => name !== plugin.name);
        this.unistylesBridge.removePlugin(plugin.name);
    };
    updateTheme = (name, theme) => {
        this.themes[name] = theme;
        if (this.unistylesBridge.themeName === name) {
            this.unistylesBridge.updateTheme(name);
        }
    };
    hasTheme = (name) => name in this.themes;
}
