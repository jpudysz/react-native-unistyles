import { Text as NativeText } from 'react-native'
import { createUnistylesElement } from 'react-native-unistyles'

// @ts-expect-error - fix typings
export const Text = createUnistylesElement(NativeText)
