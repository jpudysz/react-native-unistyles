import { NitroModules } from 'react-native-nitro-modules'
import { StatusBar as NativeStatusBar } from 'react-native'
import type { NavigationBar } from './NavigtionBar'
import type { StatusBar, StatusBarHiddenAnimation } from './StatusBar'
import type { UnistylesRuntime, MiniRuntime } from './UnistylesRuntime'
import { StatusBarStyle, ColorScheme, Orientation } from './types'
import { isIOS } from '../common'

const HybridUnistylesRuntime = NitroModules.createHybridObject<UnistylesRuntime>('UnistylesRuntime')
const HybridStatusBar = NitroModules.createHybridObject<StatusBar>('StatusBar')
const HybridNavigationBar = NitroModules.createHybridObject<NavigationBar>('NavigationBar')

HybridStatusBar.setStyle = (style: StatusBarStyle, animated?: boolean) => {
    switch (style) {
        case StatusBarStyle.Light:
            return NativeStatusBar.setBarStyle('light-content', animated)
        case StatusBarStyle.Dark:
            return NativeStatusBar.setBarStyle('dark-content', animated)
        case StatusBarStyle.Default:
            return NativeStatusBar.setBarStyle('default', animated)
    }
}

HybridStatusBar.setHidden = (isHidden: boolean, animation?: StatusBarHiddenAnimation) => {
    NativeStatusBar.setHidden(isHidden, animation)
}

if (isIOS) {
    HybridUnistylesRuntime.setImmersiveMode = HybridStatusBar.setHidden
}

HybridUnistylesRuntime.statusBar = HybridStatusBar
HybridUnistylesRuntime.navigationBar = HybridNavigationBar

export {
    HybridUnistylesRuntime as UnistylesRuntime
}

export {
    StatusBarStyle,
    ColorScheme,
    Orientation
}

export type {
    MiniRuntime
}
