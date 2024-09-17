import type { TextStyle, ViewStyle } from 'react-native'
import type { ToDeepUnistyles } from '../../src/types/stylesheet'

export type ShadowOffset = ToDeepUnistyles<{ width: number, height: number }>

export const TEXT_SHADOW_STYLES = ['textShadowColor', 'textShadowOffset', 'textShadowRadius'] as const

export type TextShadow = Required<Pick<TextStyle, typeof TEXT_SHADOW_STYLES[number]>>

export const BOX_SHADOW_STYLES = ['shadowColor', 'shadowRadius', 'shadowOpacity', 'shadowOffset'] as const

export type BoxShadow = Required<Pick<ViewStyle, typeof BOX_SHADOW_STYLES[number]>>

export type AllShadow = TextShadow & BoxShadow

export type AllShadowKeys = keyof AllShadow
