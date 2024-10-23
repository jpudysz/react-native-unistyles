import type { HybridObject } from 'react-native-nitro-modules'
import { type Dimensions, type Insets } from '../types'

type ColorScheme = 'dark' | 'light' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

export enum UnistyleDependency {
    Theme = 0,
    ThemeName = 1,
    AdaptiveThemes = 2,
    Breakpoints = 3,
    Variants = 4,
    ColorScheme = 5,
    Dimensions = 6,
    Orientation = 7,
    ContentSizeCategory = 8,
    Insets = 9,
    PixelRatio = 10,
    FontScale = 11,
    StatusBar = 12,
    NavigationBar = 13
}

export interface UnistylesNativeMiniRuntime {
    readonly colorScheme: ColorScheme,
    readonly screen: Dimensions,
    readonly contentSizeCategory: string,
    readonly insets: Insets,
    readonly pixelRatio: number,
    readonly fontScale: number,
    readonly rtl: boolean
    readonly statusBar: Dimensions,
    readonly navigationBar: Dimensions
    readonly isPortrait: boolean,
    readonly isLandscape: boolean
}

// represents any native API that can communicate with Unistyles
// not available from JS
export interface NativePlatform extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
    getInsets(): Insets,
    getColorScheme(): ColorScheme,
    getFontScale(): number,
    getPixelRatio(): number,
    getOrientation(): Orientation,
    getContentSizeCategory(): string,
    getScreenDimensions(): Dimensions,
    getStatusBarDimensions(): Dimensions,
    getNavigationBarDimensions(): Dimensions,
    getPrefersRtlDirection(): boolean,

    setRootViewBackgroundColor(color: number): void,
    setNavigationBarBackgroundColor?(color: number): void,
    setNavigationBarHidden?(isHidden: boolean): void,
    setStatusBarHidden(isHidden: boolean): void,
    setStatusBarBackgroundColor?(color: number): void,
    setImmersiveMode(isEnabled: boolean): void,

    // private
    getMiniRuntime(): UnistylesNativeMiniRuntime,
    registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>) => void): void
}
