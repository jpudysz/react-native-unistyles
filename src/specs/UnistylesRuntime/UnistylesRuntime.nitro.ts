import type { HybridObject } from 'react-native-nitro-modules'
import type { AndroidContentSizeCategory, IOSContentSizeCategory, WebContentSizeCategory } from '../../types'
import type { UnistylesNativeMiniRuntime } from '../NativePlatform'
import type { AppBreakpoint, AppThemeName, Dimensions, Insets } from '../types'

type ColorScheme = 'light' | 'dark' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

// used for Nitro. It's (Native + Cxx) type
export interface UnistylesCxxMiniRuntime extends UnistylesNativeMiniRuntime {
    readonly themeName?: string,
    readonly breakpoint?: string,
    readonly hasAdaptiveThemes: boolean,
}

// used for TS types
export interface UnistylesMiniRuntime extends UnistylesCxxMiniRuntime {
    readonly colorScheme: ColorScheme,
    readonly contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory | WebContentSizeCategory,

    // additional metadata
    readonly themeName?: AppThemeName,
    readonly breakpoint?: AppBreakpoint
}

export interface UnistylesRuntime extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly colorScheme: ColorScheme,
    readonly hasAdaptiveThemes: boolean,
    readonly screen: Dimensions,
    readonly themeName?: string,
    readonly contentSizeCategory: string,
    readonly breakpoint?: string,
    readonly breakpoints: Record<string, number>,
    readonly insets: Insets,
    readonly orientation: Orientation,
    readonly pixelRatio: number,
    readonly fontScale: number,
    readonly rtl: boolean,
    readonly isLandscape: boolean,
    readonly isPortrait: boolean,

    setTheme(themeName: string): void,
    setAdaptiveThemes(isEnabled: boolean): void,
    setImmersiveModeNative(isEnabled: boolean): void,
    nativeSetRootViewBackgroundColor(color: number): void

    // private
    readonly miniRuntime: UnistylesCxxMiniRuntime
}
