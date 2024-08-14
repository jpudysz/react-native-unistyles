import { NitroModules } from 'react-native-nitro-modules'
import type { NavigationBar } from './NavigtionBar'
import type { StatusBar } from './StatusBar'
import type { UnistylesRuntime } from './UnistylesRuntime'

const HybridUnistylesRuntime = NitroModules.createHybridObject<UnistylesRuntime>('UnistylesRuntime')
const HybridStatusBar = NitroModules.createHybridObject<StatusBar>('StatusBar')
const HybridNavigationBar = NitroModules.createHybridObject<NavigationBar>('NavigationBar')

HybridUnistylesRuntime.statusBar = HybridStatusBar
HybridUnistylesRuntime.navigationBar = HybridNavigationBar

export {
    HybridUnistylesRuntime as UnistylesRuntime
}
