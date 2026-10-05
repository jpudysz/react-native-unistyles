import type { ViewProps } from 'react-native'

import { type ComponentType, createElement, forwardRef } from 'react'
import * as ReactNative from 'react-native'

import { createUnistylesElement } from '../../core'

const RN = ReactNative as typeof ReactNative & { unstable_NativeView?: unknown }

const resolveRCTView = () => {
    // RN 0.83+ re-exports the host component, which at runtime is the 'RCTView' string itself
    if (typeof RN.unstable_NativeView === 'string') {
        return RN.unstable_NativeView
    }

    // older RN has no public handle on it, but reading View evaluates the very same module
    if (!RN.View) {
        throw new Error('Unistyles 🦄: react-native did not expose View, unable to render NativeView')
    }

    return 'RCTView'
}

// credits to @hirbod
const LeanView = forwardRef((props, ref) => {
    return createElement(resolveRCTView(), { ...props, ref })
}) as ComponentType<ViewProps>

LeanView.displayName = 'RCTView'

// named export matches unstable_NativeView from react-native
export const NativeView = createUnistylesElement(LeanView)

// this will match default export from react-native
export default NativeView
