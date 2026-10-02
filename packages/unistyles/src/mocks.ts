import type { UnistylesBreakpoints, UnistylesThemes } from './global'
import type { UnistylesNavigationBar } from './specs/NavigtionBar'
import type { UnistylesStatusBar } from './specs/StatusBar'
import type { UnistylesConfig, UnistylesStyleSheet } from './specs/StyleSheet'
import type { ColorScheme, Orientation } from './specs/types'
import type { UnistylesRuntimePrivate } from './specs/UnistylesRuntime'
import type { IOSContentSizeCategory, UnistylesTheme } from './types'

type Registry = {
    themes: UnistylesThemes
    breakpoints: UnistylesBreakpoints
}

const REGISTRY_KEY = '__UNISTYLES_MOCK_REGISTRY__' as const

type GlobalWithRegistry = typeof globalThis & {
    [REGISTRY_KEY]?: Registry
}

const getRegistry = (): Registry => {
    const globalWithRegistry = globalThis as GlobalWithRegistry

    if (!globalWithRegistry[REGISTRY_KEY]) {
        globalWithRegistry[REGISTRY_KEY] = {
            themes: {} as UnistylesThemes,
            breakpoints: {} as UnistylesBreakpoints,
        }
    }

    return globalWithRegistry[REGISTRY_KEY]
}

jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {
        createHybridObject: () => ({
            add: () => {},
            init: () => {},
            createHybridStatusBar: () => ({
                setStyle: () => {},
            }),
            createHybridNavigationBar: () => {},
        }),
    },
}))

jest.mock('react-native-unistyles', () => {
    const React = require('react')
    const _REGISTRY = getRegistry()
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
            ime: 0,
        },
        pixelRatio: 1,
        fontScale: 1,
        rtl: false,
        isLandscape: false,
        isPortrait: true,
        navigationBar: {
            width: 0,
            height: 0,
        },
        screen: {
            width: 0,
            height: 0,
        },
        statusBar: {
            width: 0,
            height: 0,
        },
    }
    const unistylesRuntime = {
        colorScheme: 'unspecified' as ColorScheme,
        contentSizeCategory: 'Medium' as IOSContentSizeCategory,
        orientation: 'portrait' as Orientation,
        isPortrait: true,
        isLandscape: false,
        breakpoints: {},
        dispose: () => {},
        equals: () => false,
        name: 'UnistylesRuntimeMock',
        miniRuntime: miniRuntime,
        statusBar: {
            height: 0,
            width: 0,
            name: 'StatusBarMock',
            equals: () => false,
            setHidden: () => {},
            setStyle: () => {},
        },
        navigationBar: {
            height: 0,
            width: 0,
            name: 'NavigationBarMock',
            equals: () => false,
            setHidden: () => {},
            dispose: () => {},
        },
        fontScale: 1,
        hasAdaptiveThemes: false,
        pixelRatio: 0,
        rtl: false,
        getTheme: () => {
            return (Object.values(_REGISTRY.themes).at(0) ?? {}) as UnistylesTheme
        },
        setTheme: () => {},
        updateTheme: () => {},
        setRootViewBackgroundColor: () => {},
        nativeSetRootViewBackgroundColor: () => {},
        createHybridStatusBar: () => {
            return {} as UnistylesStatusBar
        },
        createHybridNavigationBar: () => {
            return {} as UnistylesNavigationBar
        },
        setAdaptiveThemes: () => {},
        setImmersiveMode: () => {},
        setImmersiveModeNative: () => {},
        insets: {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ime: 0,
        },
        screen: {
            width: 0,
            height: 0,
        },
        breakpoint: undefined,
    } satisfies UnistylesRuntimePrivate

    const stripVariants = (styleEntries: Record<string, any>): any => {
        const result: Record<string, any> = {}

        for (const [name, style] of Object.entries(styleEntries)) {
            if (typeof style === 'function') {
                result[name] = (...args: Array<any>) => {
                    const resolved = style(...args)
                    const { variants, compoundVariants, ...rest } = resolved

                    return rest
                }
            } else if (style !== null && typeof style === 'object' && !Array.isArray(style)) {
                const { variants, compoundVariants, ...rest } = style

                result[name] = rest
            } else {
                result[name] = style
            }
        }

        return result
    }

    return {
        ColorScheme: {
            Light: 'light',
            Dark: 'dark',
            Unspecified: 'unspecified',
        },
        Orientation: {
            Portrait: 'portrait',
            Landscape: 'landscape',
        },
        StatusBarStyle: {
            Default: 'default',
            Light: 'light',
            Dark: 'dark',
        },
        IOSContentSizeCategory: {
            AccessibilityExtraExtraExtraLarge: 'accessibilityExtraExtraExtraLarge',
            AccessibilityExtraExtraLarge: 'accessibilityExtraExtraLarge',
            AccessibilityExtraLarge: 'accessibilityExtraLarge',
            AccessibilityLarge: 'accessibilityLarge',
            AccessibilityMedium: 'accessibilityMedium',
            ExtraExtraExtraLarge: 'xxxLarge',
            ExtraExtraLarge: 'xxLarge',
            ExtraLarge: 'xLarge',
            Large: 'Large',
            Medium: 'Medium',
            Small: 'Small',
            ExtraSmall: 'xSmall',
            Unspecified: 'unspecified',
        },
        AndroidContentSizeCategory: {
            Small: 'Small',
            Default: 'Default',
            Large: 'Large',
            ExtraLarge: 'ExtraLarge',
            Huge: 'Huge',
            ExtraHuge: 'ExtraHuge',
            ExtraExtraHuge: 'ExtraExtraHuge',
        },
        WebContentSizeCategory: {
            Unspecified: 'web-unspecified',
        },
        Hide: () => null,
        Display: () => null,
        ScopedTheme: () => null,
        withUnistyles:
            <TComponent>(
                Component: TComponent,
                mapper?: (theme: UnistylesTheme, runtime: typeof miniRuntime) => TComponent,
            ) =>
            (props: any) =>
                React.createElement(Component, {
                    ...mapper?.((Object.values(_REGISTRY.themes).at(0) ?? {}) as UnistylesTheme, miniRuntime),
                    ...props,
                }),
        mq: {
            only: {
                width: () => ({
                    and: {
                        height: () => ({}),
                    },
                }),
                height: () => ({
                    and: {
                        width: () => ({}),
                    },
                }),
            },
            width: () => ({
                and: {
                    height: () => ({}),
                },
            }),
            height: () => ({
                and: {
                    width: () => ({}),
                },
            }),
        },
        useUnistyles: () => ({
            theme: Object.values(_REGISTRY.themes).at(0) ?? {},
            rt: unistylesRuntime,
        }),
        StyleSheet: {
            absoluteFillObject: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            absoluteFill: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            } as unknown as UnistylesStyleSheet['absoluteFill'],
            compose: (styles: any) => {
                return styles
            },
            flatten: (styles: any) => {
                return styles
            },
            create: (styles: any) => {
                const resolved =
                    typeof styles === 'function'
                        ? styles(Object.values(_REGISTRY.themes).at(0) ?? {}, miniRuntime)
                        : styles

                return {
                    ...stripVariants(resolved),
                    useVariants: () => {},
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
                processColor: () => null,
                parseBoxShadowString: () => [],
            },
            hairlineWidth: 1,
            addChangeListener: () => () => {},
            init: () => {},
            name: 'StyleSheetMock',
            dispose: () => {},
            equals: () => false,
        } satisfies UnistylesStyleSheet,
        UnistylesRuntime: unistylesRuntime,
    }
})

jest.mock('react-native-unistyles/reanimated', () => {
    const unistyles = require('react-native-unistyles')
    const mockedSharedValue = (value: any) => ({
        get: () => value,
        set: (_value: any) => {},
        value,
    })

    return {
        useAnimatedTheme: () => {
            const theme = unistyles.useUnistyles().theme
            const sharedTheme = mockedSharedValue(theme)

            return sharedTheme
        },
        useAnimatedVariantColor: () => {
            const fromValue = mockedSharedValue('#000000')
            const toValue = mockedSharedValue('#FFFFFF')

            return {
                fromValue,
                toValue,
            }
        },
    }
})
