import { StatusBar as NativeStatusBar } from 'react-native'
import type { UnistylesStatusBar as UnistylesStatusBarSpec } from './UnistylesStatusBar.nitro'
import { StatusBarStyle } from '../types'

export type StatusBarHiddenAnimation = 'none' | 'fade' | 'slide'

export interface UnistylesStatusBar extends Omit<UnistylesStatusBarSpec, 'setBackgroundColor' | 'dispose'> {
    setStyle(style: StatusBarStyle, animated?: boolean): void,
    setHidden(isHidden: boolean, animation?: StatusBarHiddenAnimation): void,
    setBackgroundColor(color?: string): void
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

    hybridObject.setHidden = (isHidden: boolean, animation?: StatusBarHiddenAnimation) => {
        NativeStatusBar.setHidden(isHidden, animation)
    }
}
