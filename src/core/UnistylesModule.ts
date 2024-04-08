import { NativeEventEmitter, NativeModules } from 'react-native'
import type { UnistylesThemes, UnistylesBreakpoints } from 'react-native-unistyles'
import type { ColorSchemeName, ScreenInsets, StatusBar, NavigationBar } from '../types'
import { normalizeWebStylesPlugin } from '../plugins'
import { isServer } from '../common'

export class UnistylesBridgeWeb {
    #timerRef?: ReturnType<typeof setTimeout> = undefined
    #hasAdaptiveThemes: boolean = false
    #supportsAutomaticColorScheme = false
    #screenWidth = isServer ? undefined : window.innerWidth
    #screenHeight = isServer ? undefined : window.innerHeight
    #themes: Array<keyof UnistylesThemes> = []
    #breakpoints: UnistylesBreakpoints = {} as UnistylesBreakpoints
    #colorScheme: ColorSchemeName = this.getPreferredColorScheme()
    #themeName: keyof UnistylesThemes = '' as keyof UnistylesThemes
    #enabledPlugins: Array<string> = [normalizeWebStylesPlugin.name]
    #unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles)
    #sortedBreakpointPairs: Array<[keyof UnistylesBreakpoints, number]> = []
    #breakpoint: keyof UnistylesBreakpoints = '' as keyof UnistylesBreakpoints
    #contentSizeCategory: string = 'unspecified'
    #insets: ScreenInsets = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    }
    #statusBar: StatusBar = {
        height: 0,
        width: 0,
        setColor: () => {}
    }
    #navigationBar: NavigationBar = {
        height: 0,
        width: 0,
        setColor: () => {}
    }

    constructor() {
        if (!isServer) {
            this.setupListeners()
            this.#screenWidth = window.innerWidth
            this.#screenHeight = window.innerHeight
        }
    }

    public install() {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        globalThis.__UNISTYLES__ = new Proxy({}, {
            get: (_target, prop) => {
                switch (prop) {
                    case 'themeName':
                        return this.getTheme()
                    case 'screenWidth':
                        return this.#screenWidth
                    case 'screenHeight':
                        return this.#screenHeight
                    case 'contentSizeCategory':
                        return this.#contentSizeCategory
                    case 'breakpoint':
                        return this.#breakpoint || undefined
                    case 'breakpoints':
                        return this.#breakpoints
                    case 'hasAdaptiveThemes':
                        return this.#hasAdaptiveThemes
                    case 'sortedBreakpointPairs':
                        return this.#sortedBreakpointPairs
                    case 'enabledPlugins':
                        return this.#enabledPlugins
                    case 'colorScheme':
                        return this.#colorScheme
                    case 'insets':
                        return this.#insets
                    case 'statusBar':
                        return this.#statusBar
                    case 'navigationBar':
                        return this.#navigationBar
                    case 'useTheme':
                        return (themeName: keyof UnistylesThemes) => this.useTheme(themeName)
                    case 'updateTheme':
                        return (themeName: keyof UnistylesThemes) => this.updateTheme(themeName)
                    case 'useBreakpoints':
                        return (breakpoints: UnistylesBreakpoints) => this.useBreakpoints(breakpoints)
                    case 'useAdaptiveThemes':
                        return (enable: boolean) => this.useAdaptiveThemes(enable)
                    case 'addPlugin':
                        return (pluginName: string, notify: boolean) => this.addPlugin(pluginName, notify)
                    case 'removePlugin':
                        return (pluginName: string) => this.removePlugin(pluginName)
                    default:
                        return Reflect.get(this, prop)
                }
            },
            set: (target, prop, newValue, receiver) => {
                switch (prop) {
                    case 'themes': {
                        this.#themes = newValue
                        this.#supportsAutomaticColorScheme = newValue.includes('light') && newValue.includes('dark')

                        return true
                    }
                    case 'themeName': {
                        this.#themeName = newValue as keyof UnistylesThemes
                        this.emitThemeChange()

                        return true
                    }
                    default:
                        return Reflect.set(target, prop, newValue, receiver)
                }
            }
        })

        return true
    }

    private useTheme(themeName: keyof UnistylesThemes) {
        this.#themeName = themeName
        this.emitThemeChange()
    }

    private updateTheme(themeName: keyof UnistylesThemes) {
        if (!this.#themeName) {
            this.#themeName = this.getTheme()
        }

        if (this.#themeName === themeName) {
            this.emitThemeChange()
        }
    }

    private useBreakpoints(breakpoints: UnistylesBreakpoints) {
        this.#breakpoints = breakpoints
        this.#sortedBreakpointPairs = Object
            .entries(breakpoints)
            .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0)) as Array<[keyof UnistylesBreakpoints, number]>

        if (!isServer) {
            this.#breakpoint = this.getBreakpointFromScreenWidth(this.#screenWidth as number)
        }
    }

    private useAdaptiveThemes(enable: boolean) {
        this.#hasAdaptiveThemes = enable

        if (!this.#hasAdaptiveThemes || !this.#supportsAutomaticColorScheme) {
            return
        }

        if (this.#themeName !== this.#colorScheme) {
            this.#themeName = this.#colorScheme as keyof UnistylesThemes
            this.emitThemeChange()
        }
    }

    private addPlugin(pluginName: string, notify: boolean) {
        this.#enabledPlugins = [pluginName].concat(this.#enabledPlugins)

        if (notify) {
            this.emitPluginChange()
        }
    }

    private removePlugin(pluginName: string) {
        this.#enabledPlugins = this.#enabledPlugins.filter(name => name !== pluginName)
        this.emitPluginChange()
    }

    private getTheme(): keyof UnistylesThemes {
        if (this.#themes.length === 1) {
            return this.#themes.at(0) as keyof UnistylesThemes
        }

        return this.#themeName
    }

    private setupListeners() {
        window.addEventListener('resize', () => {
            clearTimeout(this.#timerRef)

            this.#timerRef = setTimeout(() => {
                this.#screenWidth = window.innerWidth
                this.#screenHeight = window.innerHeight
                this.#breakpoint = this.getBreakpointFromScreenWidth(this.#screenWidth)

                this.emitLayoutChange()
            }, 100)
        })

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            this.#colorScheme = event.matches
                ? 'dark'
                : 'light'

            if (!this.#supportsAutomaticColorScheme || !this.#hasAdaptiveThemes) {
                return
            }

            if (this.#colorScheme !== this.#themeName) {
                this.#themeName = this.#colorScheme as keyof UnistylesThemes
                this.emitThemeChange()
            }
        })
    }

    private getBreakpointFromScreenWidth(width: number): keyof UnistylesBreakpoints {
        const breakpoint = this.#sortedBreakpointPairs
            .find(([, value], index, otherBreakpoints) => {
                const minVal = value
                const maxVal = otherBreakpoints[index + 1]?.[1]

                if (!maxVal) {
                    return true
                }

                return width >= minVal && width < maxVal
            })

        return breakpoint?.at(0) as keyof UnistylesBreakpoints
    }

    private getPreferredColorScheme() {
        if (!isServer && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark'
        }

        return 'light'
    }

    private emitPluginChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'plugin'
        })
    }

    private emitThemeChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'theme',
            payload: {
                themeName: this.#themeName
            }
        })
    }

    private emitLayoutChange() {
        this.#unistylesEvents.emit('__unistylesOnChange', {
            type: 'layout',
            payload: {
                breakpoint: this.#breakpoint,
                orientation: (this.#screenWidth as number) > (this.#screenHeight as number)
                    ? 'landscape'
                    : 'portrait',
                screen: {
                    width: this.#screenWidth,
                    height: this.#screenHeight
                }
            }
        })
    }
}

export const UnistylesModule = new UnistylesBridgeWeb()
