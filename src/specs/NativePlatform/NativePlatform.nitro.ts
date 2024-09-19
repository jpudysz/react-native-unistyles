import type { HybridObject } from 'react-native-nitro-modules'
import { type Dimensions, type Insets } from '../types'

type ColorScheme = 'dark' | 'light' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

enum UnistyleDependency {
    Theme = 0, // todo do I need it, dynamic function is always recomputed
    Breakpoints = 1,
    Variants = 2,
    CompoundVariants = 3, // todo do I need it
    ColorScheme = 4,
    Rtl = 5, // todo do I need it, it's not dynamic
    Dimensions = 6,
    Orientation = 7,
    ThemeName = 8,
    ContentSizeCategory = 9,
    Insets = 10,
    PixelRatio = 11,
    FontScale = 12,
    StatusBar = 13
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
    readonly orientation: Orientation
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

    setRootViewBackgroundColor(color?: number): void,
    setNavigationBarBackgroundColor?(color?: number): void,
    setNavigationBarHidden?(isHidden: boolean): void,
    setStatusBarBackgroundColor?(color?: number): void,
    setImmersiveMode(isEnabled: boolean): void,

    // private
    getMiniRuntime(): UnistylesNativeMiniRuntime,
    registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>) => void): void
}
