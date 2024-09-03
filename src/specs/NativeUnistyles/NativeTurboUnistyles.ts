import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

interface Spec extends TurboModule {}

TurboModuleRegistry.get<Spec>('Unistyles')
