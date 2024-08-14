import { NativeEventEmitter, NativeModules } from 'react-native';
import { normalizeWebStylesPlugin } from '../plugins';
import { isServer } from '../common';
export class UnistylesBridgeWeb {
    #timerRef = undefined;
    #windowResizeDebounceTimeMs = 100;
    #hasAdaptiveThemes = false;
    #supportsAutomaticColorScheme = false;
    #screenWidth = isServer ? undefined : window.innerWidth;
    #screenHeight = isServer ? undefined : window.innerHeight;
    #themes = [];
    #breakpoints = {};
    #colorScheme = this.getPreferredColorScheme();
    #themeName = '';
    #enabledPlugins = [normalizeWebStylesPlugin.name];
    #unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles);
    #sortedBreakpointPairs = [];
    #breakpoint = '';
    #contentSizeCategory = 'unspecified';
    #insets = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };
    #statusBar = {
        height: 0,
        width: 0,
        setColor: () => { },
        setHidden: () => { }
    };
    #navigationBar = {
        height: 0,
        width: 0,
        setColor: () => { },
        setHidden: () => { }
    };
    #pixelRatio = 1.0;
    #fontScale = 1.0;
    #hairlineWidth = 1;
    #rtl = false;
    constructor() {
        if (!isServer) {
            this.setupListeners();
            this.#screenWidth = window.innerWidth;
            this.#screenHeight = window.innerHeight;
            this.#rtl = document.documentElement.dir === 'rtl';
        }
    }
    install() {
        // @ts-ignore
        globalThis.__UNISTYLES__ = new Proxy({}, {
            get: (_target, prop) => {
                switch (prop) {
                    case 'themeName':
                        return this.getTheme();
                    case 'screenWidth':
                        return this.#screenWidth;
                    case 'screenHeight':
                        return this.#screenHeight;
                    case 'contentSizeCategory':
                        return this.#contentSizeCategory;
                    case 'breakpoint':
                        return this.#breakpoint || undefined;
                    case 'breakpoints':
                        return this.#breakpoints;
                    case 'hasAdaptiveThemes':
                        return this.#hasAdaptiveThemes;
                    case 'sortedBreakpointPairs':
                        return this.#sortedBreakpointPairs;
                    case 'enabledPlugins':
                        return this.#enabledPlugins;
                    case 'colorScheme':
                        return this.#colorScheme;
                    case 'insets':
                        return this.#insets;
                    case 'statusBar':
                        return this.#statusBar;
                    case 'navigationBar':
                        return this.#navigationBar;
                    case 'pixelRatio':
                        return this.#pixelRatio;
                    case 'fontScale':
                        return this.#fontScale;
                    case 'hairlineWidth':
                        return this.#hairlineWidth;
                    case 'rtl':
                        return this.#rtl;
                    case 'useTheme':
                        return (themeName) => this.useTheme(themeName);
                    case 'updateTheme':
                        return (themeName) => this.updateTheme(themeName);
                    case 'useBreakpoints':
                        return (breakpoints) => this.useBreakpoints(breakpoints);
                    case 'useAdaptiveThemes':
                        return (enable) => this.useAdaptiveThemes(enable);
                    case 'addPlugin':
                        return (pluginName, notify) => this.addPlugin(pluginName, notify);
                    case 'removePlugin':
                        return (pluginName) => this.removePlugin(pluginName);
                    case 'setRootViewBackgroundColor':
                        return (color) => this.setRootViewBackgroundColor(color);
                    case 'setImmersiveMode':
                        return () => { };
                    case 'setWindowResizeDebounceTimeMs':
                        return (timeMs) => {
                            if (timeMs >= 0) {
                                this.#windowResizeDebounceTimeMs = timeMs;
                            }
                        };
                    default:
                        return Reflect.get(this, prop);
                }
            },
            set: (target, prop, newValue, receiver) => {
                switch (prop) {
                    case 'themes': {
                        this.#themes = newValue;
                        this.#supportsAutomaticColorScheme = newValue.includes('light') && newValue.includes('dark');
                        return true;
                    }
                    case 'themeName': {
                        this.#themeName = newValue;
                        this.emitThemeChange();
                        return true;
                    }
                    default:
                        return Reflect.set(target, prop, newValue, receiver);
                }
            }
        });
        return true;
    }
    useTheme(themeName) {
        this.#themeName = themeName;
        this.emitThemeChange();
    }
    updateTheme(themeName) {
        if (!this.#themeName) {
            this.#themeName = this.getTheme();
        }
        if (this.#themeName === themeName) {
            this.emitThemeChange();
        }
    }
    useBreakpoints(breakpoints) {
        this.#breakpoints = breakpoints;
        this.#sortedBreakpointPairs = Object
            .entries(breakpoints)
            .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0));
        if (!isServer) {
            this.#breakpoint = this.getBreakpointFromScreenWidth(this.#screenWidth);
        }
    }
    useAdaptiveThemes(enable) {
        this.#hasAdaptiveThemes = enable;
        if (!this.#hasAdaptiveThemes || !this.#supportsAutomaticColorScheme) {
            return;
        }
        if (this.#themeName !== this.#colorScheme) {
            this.#themeName = this.#colorScheme;
            this.emitThemeChange();
        }
    }
    addPlugin(pluginName, notify) {
        this.#enabledPlugins = [pluginName].concat(this.#enabledPlugins);
        if (notify) {
            this.emitPluginChange();
        }
    }
    removePlugin(pluginName) {
        this.#enabledPlugins = this.#enabledPlugins.filter(name => name !== pluginName);
        this.emitPluginChange();
    }
    getTheme() {
        if (this.#themes.length === 1) {
            return this.#themes.at(0);
        }
        return this.#themeName;
    }
    setupListeners() {
        const onResize = () => {
            this.#screenWidth = window.innerWidth;
            this.#screenHeight = window.innerHeight;
            this.#breakpoint = this.getBreakpointFromScreenWidth(this.#screenWidth);
            this.emitLayoutChange();
        };
        window.addEventListener('resize', () => {
            if (this.#windowResizeDebounceTimeMs === 0) {
                return onResize();
            }
            clearTimeout(this.#timerRef);
            this.#timerRef = setTimeout(onResize, this.#windowResizeDebounceTimeMs);
        });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            this.#colorScheme = event.matches
                ? 'dark'
                : 'light';
            if (!this.#supportsAutomaticColorScheme || !this.#hasAdaptiveThemes) {
                return;
            }
            if (this.#colorScheme !== this.#themeName) {
                this.#themeName = this.#colorScheme;
                this.emitThemeChange();
            }
        });
        new MutationObserver(() => {
            this.#rtl = document.documentElement.dir === 'rtl';
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });
    }
    getBreakpointFromScreenWidth(width) {
        const breakpoint = this.#sortedBreakpointPairs
            .find(([, value], index, otherBreakpoints) => {
            const minVal = value;
            const maxVal = otherBreakpoints[index + 1]?.[1];
            if (!maxVal) {
                return true;
            }
            return width >= minVal && width < maxVal;
        });
        return breakpoint?.at(0);
    }
    getPreferredColorScheme() {
        if (!isServer && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    setRootViewBackgroundColor(color) {
        document.body.style.backgroundColor = color;
    }
    emitPluginChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'plugin'
        });
    }
    emitThemeChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'theme',
            payload: {
                themeName: this.#themeName
            }
        });
    }
    emitLayoutChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'layout',
            payload: {
                breakpoint: this.#breakpoint,
                orientation: this.#screenWidth > this.#screenHeight
                    ? 'landscape'
                    : 'portrait',
                screen: {
                    width: this.#screenWidth,
                    height: this.#screenHeight
                }
            }
        });
    }
}
export const UnistylesModule = new UnistylesBridgeWeb();
