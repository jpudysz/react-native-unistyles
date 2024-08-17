import type { HybridObject } from 'react-native-nitro-modules'
import type { Insets } from './types'

type StatusBarStyle = 'default' | 'light' | 'dark'

export interface NativePlatform extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
    getInsets(): Insets,
    getColorScheme(): string,
    getFontScale(): number,
    getContentSizeCategory(): string,

    setRootViewBackgroundColor(hex?: string, alpha?: number): void,
    setNavigationBarBackgroundColor?(hex?: string, alpha?: number): void,
    setNavigationBarHidden?(isHidden: boolean): void,
    setStatusBarStyle(style: StatusBarStyle): void,
    setStatusBarHidden(isHidden: boolean): void,
    setStatusBarBackgroundColor?(hex?: string, alpha?: number): void,
    setImmersiveMode(isEnabled: boolean): void,
}
