import type { ViewProps } from 'react-native'

import { type ComponentType, createElement, forwardRef } from 'react'
// registers the RCTView view config as a module side effect,
// otherwise createElement('RCTView') throws when no <View> has mounted yet
import 'react-native/Libraries/Components/View/ViewNativeComponent'
import { createUnistylesElement } from '../../core'

// credits to @hirbod
const LeanView = forwardRef((props, ref) => {
    return createElement('RCTView', { ...props, ref })
}) as ComponentType<ViewProps>

LeanView.displayName = 'RCTView'

// this will match default export from react-native
export default createUnistylesElement(LeanView)
