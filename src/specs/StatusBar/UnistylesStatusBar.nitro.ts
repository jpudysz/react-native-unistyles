import type { HybridObject } from 'react-native-nitro-modules'

// created from UnistylesRuntime, do not use it directly
export interface UnistylesStatusBar extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly width: number,
    readonly height: number,

    setHidden(isHidden: boolean): void,
}
