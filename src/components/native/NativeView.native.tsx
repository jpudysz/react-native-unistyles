import type { ViewProps } from 'react-native'
import { type ComponentType, createElement, forwardRef } from 'react'
import { createUnistylesElement } from '../../core'

// credits to @hirbod
const LeanView = forwardRef((props, ref) => {
    return createElement('RCTView', { ...props, ref })
}) as ComponentType<ViewProps>

LeanView.displayName = 'RCTView'

// this will match default export from react-native
export default createUnistylesElement(LeanView)
