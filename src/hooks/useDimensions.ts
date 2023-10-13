import { useWindowDimensions } from 'react-native'
import type { ScreenSize } from '../types'

export const useDimensions = (): ScreenSize => useWindowDimensions()
