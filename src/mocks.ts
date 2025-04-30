import type { UnistylesBreakpoints, UnistylesThemes } from './global'
import type { UnistylesNavigationBar } from './specs/NavigtionBar'
import type { UnistylesStatusBar } from './specs/StatusBar'
import type { UnistylesConfig, UnistylesStyleSheet } from './specs/StyleSheet'
import type { UnistylesRuntimePrivate } from './specs/UnistylesRuntime'
import type { ColorScheme, Orientation } from './specs/types'
import type { IOSContentSizeCategory, UnistylesTheme } from './types'

type Registry = {
    themes: UnistylesThemes
    breakpoints: UnistylesBreakpoints
}

jest.mock('react-native', () => ({
    TurboModuleRegistry: {
        get: () => ({})
    },
    StyleSheet: {},
    Platform: {
        OS: 'headless'
    }
}))

jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {
        createHybridObject: () => ({
            add: () => {},
            init: () => {},
            createHybridStatusBar: () => ({
                setStyle: () => {},
            }),
            createHybridNavigationBar: () => {},
        })
    }
}))

jest.mock('react-native-unistyles', () => {
    const _REGISTRY: Registry = {
        themes: {},
        breakpoints: {}
    }
    const miniRuntime = {
        themeName: undefined,
        breakpoint: undefined,
        hasAdaptiveThemes: false,
        colorScheme: 'unspecified' as ColorScheme,
        contentSizeCategory: 'Medium' as IOSContentSizeCategory,
        insets: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ime: 0
        },
        pixelRatio: 1,
        fontScale: 1,
        rtl: false,
        isLandscape: false,
        isPortrait: true,
        navigationBar: {
            width: 0,
            height: 0
        },
        screen: {
            width: 0,
            height: 0
        },
        statusBar: {
            width: 0,
            height: 0
        }
    }

    return {
        StyleSheet: {
            absoluteFillObject: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            },
            absoluteFill: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            } as unknown as UnistylesStyleSheet['absoluteFill'],
            compose: (styles: any) => {
                return styles
            },
            flatten: (styles: any) => {
                return styles
            },
            create: (styles: any) => {
                if (typeof styles === 'function') {
                    const firstTheme = Object.values(_REGISTRY.themes).at(0) ?? {}

                    return {
                        ...styles(firstTheme, miniRuntime),
                        useVariants: () => {}
                    }
                }

                return {
                    ...styles,
                    useVariants: () => {}
                }
            },
            configure: (config: UnistylesConfig) => {
                if (config.breakpoints) {
                    _REGISTRY.breakpoints = config.breakpoints
                }

                if (config.themes) {
                    _REGISTRY.themes = config.themes
                }
            },
            jsMethods: {
                processColor: () => null
            },
            hairlineWidth: 1,
            unid: -1,
            addChangeListener: () => () => {},
            init: () => {},
            name: 'StyleSheetMock',
            dispose: () => {},
            equals: () => false
        } satisfies UnistylesStyleSheet,
        UnistylesRuntime: {
            colorScheme: 'unspecified' as ColorScheme,
            contentSizeCategory: 'Medium' as IOSContentSizeCategory,
            orientation: 'portrait' as Orientation,
            breakpoints: {},
            dispose: () => { },
            equals: () => false,
            name: 'UnistylesRuntimeMock',
            miniRuntime: miniRuntime,
            statusBar: {
                height: 0,
                width: 0,
                name: 'StatusBarMock',
                equals: () => false,
                setHidden: () => { },
                setStyle: () => { }
            },
            navigationBar: {
                height: 0,
                width: 0,
                name: 'NavigationBarMock',
                equals: () => false,
                setHidden: () => { },
                dispose: () => { }
            },
            fontScale: 1,
            hasAdaptiveThemes: false,
            pixelRatio: 0,
            rtl: false,
            getTheme: () => {
                return {} as UnistylesTheme
            },
            setTheme: () => {},
            updateTheme: () => {},
            setRootViewBackgroundColor: () => {},
            _setRootViewBackgroundColor: () => {},
            createHybridStatusBar: () => {
                return {} as UnistylesStatusBar
            },
            createHybridNavigationBar: () => {
                return {} as UnistylesNavigationBar
            },
            setAdaptiveThemes: () => {},
            setImmersiveMode: () => {},
            insets: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                ime: 0
            },
            screen: {
                width: 0,
                height: 0
            },
            breakpoint: undefined
        } satisfies UnistylesRuntimePrivate
    }
})


