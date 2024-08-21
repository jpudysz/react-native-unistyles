import type { HybridObject } from 'react-native-nitro-modules'
import type { Dimensions, Insets } from '../types'

type ColorScheme = 'light' | 'dark' | 'unspecified'
type Orientation = 'portrait' | 'landscape'

export interface MiniRuntime extends HybridObject<{ ios: 'c++', android: 'c++' }> {
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
