import type { HybridObject } from 'react-native-nitro-modules'

import type { UnistyleDependency } from '../NativePlatform'

export interface UnistylesStyleSheet extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
    readonly hairlineWidth: number

    addChangeListener(onChanged: (dependencies: Array<UnistyleDependency>) => void): () => void
}
