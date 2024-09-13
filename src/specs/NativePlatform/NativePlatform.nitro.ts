import type { HybridObject } from 'react-native-nitro-modules'
import type { Dimensions, Insets } from '../types'

type ColorScheme = 'dark' | 'light' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

enum UnistyleDependency {
    Theme = 0,
    Breakpoints = 1,
    Variants = 2,
    CompoundVariants = 3,
    ColorScheme = 4,
    Rtl = 5,
    Dimensions = 6,
    Orientation = 7,
    ThemeName = 8,
    ContentSizeCategory = 9,
    Insets = 10,
    PixelRatio = 11,
    FontScale = 12
}

export interface UnistylesMiniRuntime {
    readonly colorScheme: ColorScheme,
    readonly hasAdaptiveThemes: boolean,
    readonly screen: Dimensions,
    readonly themeName?: string,
    readonly contentSizeCategory: string,
    readonly breakpoint?: string,
    readonly insets: Insets,
    readonly orientation: Orientation,
    readonly pixelRatio: number,
    readonly fontScale: number,
    readonly rtl: boolean
    readonly statusBar: Dimensions,
    readonly navigationBar: Dimensions
}

// represents any native API that can communicate with Unistyles
// not available from JS
export interface NativePlatform extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
    getInsets(): Insets,
    getColorScheme(): ColorScheme,
    getFontScale(): number,
    getPixelRatio(): number,
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
    buildMiniRuntime(): UnistylesMiniRuntime,
    registerPlatformListener(callback: (dependencies: Array<UnistyleDependency>) => void): void
}
