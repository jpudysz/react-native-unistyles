import type { TextProps } from 'react-native'

import { type ComponentType, createElement, forwardRef } from 'react'
import * as ReactNative from 'react-native'

import { createUnistylesElement } from '../../core'

const RN = ReactNative as typeof ReactNative & { unstable_NativeText?: unknown }

const resolveRCTText = () => {
    // RN 0.83+ re-exports the host component, which at runtime is the 'RCTText' string itself
    if (typeof RN.unstable_NativeText === 'string') {
        return RN.unstable_NativeText
    }

    // older RN has no public handle on it, but reading Text evaluates the very same module
    if (!RN.Text) {
        throw new Error('Unistyles 🦄: react-native did not expose Text, unable to render NativeText')
    }

    return 'RCTText'
}

// credits to @hirbod
const LeanText = forwardRef((props, ref) => {
    return createElement(resolveRCTText(), { ...props, ref })
}) as ComponentType<TextProps>

LeanText.displayName = 'RCTText'

export const NativeText = createUnistylesElement(LeanText)
