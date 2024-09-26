import { processColor, StatusBar as NativeStatusBar } from 'react-native'
import type { UnistylesStatusBar as UnistylesStatusBarSpec } from './UnistylesStatusBar.nitro'
import { type Color, StatusBarStyle } from '../types'

export type StatusBarHiddenAnimation = 'none' | 'fade' | 'slide'

interface PrivateUnistylesStatusBar extends Omit<UnistylesStatusBarSpec, 'setBackgroundColor'> {
    setStyle(style: StatusBarStyle, animated?: boolean): void,
    setHidden(isHidden: boolean, animation?: StatusBarHiddenAnimation): void,
    setBackgroundColor(color?: string): void,
    _setBackgroundColor(color?: Color): void
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

    const privateHybrid = hybridObject as PrivateUnistylesStatusBar

    privateHybrid._setBackgroundColor = hybridObject.setBackgroundColor
    hybridObject.setBackgroundColor = (color?: string) => {
        const parsedColor = processColor(color)

        privateHybrid._setBackgroundColor(parsedColor as number)
    }
}

type PrivateMethods =
    | '_setBackgroundColor'
    | 'dispose'

export type UnistylesStatusBar = Omit<PrivateUnistylesStatusBar, PrivateMethods>
