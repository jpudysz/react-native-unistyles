import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

// this is empty spec for TurboModule that is required to hook Unistyles to Fabric
interface Spec extends TurboModule {}

TurboModuleRegistry.get<Spec>('Unistyles')
