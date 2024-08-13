import type { HybridObject } from 'react-native-nitro-modules'

type StatusBarStyle = 'default' | 'light' | 'dark'

export interface StatusBar extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly width: number,
    readonly height: number,

    setStyle(style: StatusBarStyle): void,
    setBackgroundColor(hex?: string, alpha?: number): void,
    setHidden(isHidden: boolean): void
}
