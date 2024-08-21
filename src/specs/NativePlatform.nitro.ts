import type { HybridObject } from 'react-native-nitro-modules'
import type { Dimensions, Insets } from './types'

type ColorScheme = 'dark' | 'light' | 'unspecified'

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

    setRootViewBackgroundColor(hex?: string, alpha?: number): void,
    setNavigationBarBackgroundColor?(hex?: string, alpha?: number): void,
    setNavigationBarHidden?(isHidden: boolean): void,
    setStatusBarBackgroundColor?(hex?: string, alpha?: number): void,
    setImmersiveMode(isEnabled: boolean): void,
}
