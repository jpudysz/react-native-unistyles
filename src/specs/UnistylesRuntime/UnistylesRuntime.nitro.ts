import type { HybridObject } from 'react-native-nitro-modules'
import type { Dimensions, Insets } from '../types'

type ColorScheme = 'light' | 'dark' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

export interface UnistylesRuntime extends HybridObject<{ ios: 'c++', android: 'c++' }> {
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
    readonly rtl: boolean,

    setTheme(themeName: string): void,
    setAdaptiveThemes(isEnabled: boolean): void,
    setImmersiveMode(isEnabled: boolean): void,
    setRootViewBackgroundColor(color?: number): void
}
