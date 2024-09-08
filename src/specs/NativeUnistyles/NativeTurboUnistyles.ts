import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

interface Spec extends TurboModule {
    updateUIProps: () => void
}

TurboModuleRegistry.get<Spec>('Unistyles')
