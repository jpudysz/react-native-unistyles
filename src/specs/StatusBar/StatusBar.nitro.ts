import type { HybridObject } from 'react-native-nitro-modules'

export interface StatusBar extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly width: number,
    readonly height: number,

    setBackgroundColor(hex?: string, alpha?: number): void,
}
