import type { HybridObject } from 'react-native-nitro-modules'

export interface StyleSheet extends HybridObject<{ ios: 'c++', android: 'c++' }> {
    readonly hairlineWidth: number
}
