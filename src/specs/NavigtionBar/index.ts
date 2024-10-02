import { processColor } from 'react-native'
import type { UnistylesNavigationBar as UnistylesNavigationBarSpec } from './UnistylesNavigationBar.nitro'
import type { Color } from '../types'

interface PrivateUnistylesNavigationBar extends Omit<UnistylesNavigationBarSpec, 'setBackgroundColor'> {
    setBackgroundColor(color?: string): void,
    _setBackgroundColor(color?: Color): void
}

export const attachNavigationBarJSMethods = (hybridObject: UnistylesNavigationBar) => {
    const privateHybrid = hybridObject as PrivateUnistylesNavigationBar

    privateHybrid._setBackgroundColor = hybridObject.setBackgroundColor
    hybridObject.setBackgroundColor = (color?: string) => {
        const parsedColor = processColor(color)

        privateHybrid._setBackgroundColor(parsedColor as number)
    }
}

type PrivateMethods =
    | '_setBackgroundColor'
    | 'dispose'

export type UnistylesNavigationBar = Omit<PrivateUnistylesNavigationBar, PrivateMethods>
