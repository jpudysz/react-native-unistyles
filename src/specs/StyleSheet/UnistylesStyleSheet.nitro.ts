import type { HybridObject } from 'react-native-nitro-modules'

export interface UnistylesStyleSheet extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly hairlineWidth: number
    readonly unid: number
}
