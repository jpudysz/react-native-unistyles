import { Text as NativeText } from 'react-native'
import { createUnistylesElement } from '../core'

// @ts-expect-error - fix typings
export const Text = createUnistylesElement(NativeText)
