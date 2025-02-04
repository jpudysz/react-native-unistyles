import { StatusBar as NativeStatusBar } from 'react-native'
import { StatusBarStyle } from '../types'
import type { UnistylesStatusBar as UnistylesStatusBarSpec } from './UnistylesStatusBar.nitro'

export type StatusBarHiddenAnimation = 'none' | 'fade' | 'slide'

interface PrivateUnistylesStatusBar extends Omit<UnistylesStatusBarSpec, 'setBackgroundColor' | 'setHidden'> {
    setStyle(style: StatusBarStyle, animated?: boolean): void
    setHidden(isHidden: boolean, animation?: StatusBarHiddenAnimation): void
    _setHidden(isHidden: boolean, animation?: StatusBarHiddenAnimation): void
}

export const attachStatusBarJSMethods = (hybridObject: UnistylesStatusBar) => {
    hybridObject.setStyle = (style: StatusBarStyle, animated?: boolean) => {
        switch (style) {
            case StatusBarStyle.Light:
                return NativeStatusBar.setBarStyle('light-content', animated)
            case StatusBarStyle.Dark:
                return NativeStatusBar.setBarStyle('dark-content', animated)
            case StatusBarStyle.Default:
                return NativeStatusBar.setBarStyle('default', animated)
        }
    }

    const privateHybrid = hybridObject as PrivateUnistylesStatusBar

    privateHybrid._setHidden = hybridObject.setHidden
    hybridObject.setHidden = (isHidden: boolean, animation?: StatusBarHiddenAnimation) => {
        NativeStatusBar.setHidden(isHidden, animation)
        privateHybrid._setHidden(isHidden)
    }
}

type PrivateMethods = '_setHidden' | 'dispose'

export type UnistylesStatusBar = Omit<PrivateUnistylesStatusBar, PrivateMethods>
