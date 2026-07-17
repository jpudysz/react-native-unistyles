import type { TextProps } from 'react-native'

import { type ComponentType, createElement, forwardRef } from 'react'
// registers the RCTText view config as a module side effect,
// otherwise createElement('RCTText') throws when no <Text> has mounted yet
import 'react-native/Libraries/Text/TextNativeComponent'
import { createUnistylesElement } from '../../core'

// credits to @hirbod
const LeanText = forwardRef((props, ref) => {
    return createElement('RCTText', { ...props, ref })
}) as ComponentType<TextProps>

LeanText.displayName = 'RCTText'

export const NativeText = createUnistylesElement(LeanText)
