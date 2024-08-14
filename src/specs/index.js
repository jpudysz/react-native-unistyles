import { NitroModules } from 'react-native-nitro-modules';
const HybridUnistylesRuntime = NitroModules.createHybridObject('UnistylesRuntime');
const HybridStatusBar = NitroModules.createHybridObject('StatusBar');
const HybridNavigationBar = NitroModules.createHybridObject('NavigationBar');
HybridUnistylesRuntime.statusBar = HybridStatusBar;
HybridUnistylesRuntime.navigationBar = HybridNavigationBar;
export { HybridUnistylesRuntime as UnistylesRuntime };
