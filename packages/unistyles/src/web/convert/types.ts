import type { FilterFunction, TextStyle, ViewStyle } from 'react-native'

import type { UnionToIntersection } from '../../types'
import type { ToDeepUnistyles } from '../../types/stylesheet'

export type ShadowOffset = ToDeepUnistyles<{ width: number; height: number }>

export const TEXT_SHADOW_STYLES = ['textShadowColor', 'textShadowOffset', 'textShadowRadius'] as const

export type TextShadow = Required<Pick<TextStyle, (typeof TEXT_SHADOW_STYLES)[number]>>

export const BOX_SHADOW_STYLES = ['shadowColor', 'shadowRadius', 'shadowOpacity', 'shadowOffset'] as const

export type BoxShadow = Required<Pick<ViewStyle, (typeof BOX_SHADOW_STYLES)[number]>>

export type AllShadow = TextShadow & BoxShadow

export type AllShadowKeys = keyof AllShadow

type FilterKeys = keyof UnionToIntersection<FilterFunction>

export type Filters = {
    [K in FilterKeys]: UnionToIntersection<FilterFunction>[K]
}
