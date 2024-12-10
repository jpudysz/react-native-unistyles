import { type ComponentType } from 'react'
import type { UnistylesTheme } from '../types'
import { withUnistyles } from './withUnistyles'

const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const

type SupportedStyleProps = typeof SUPPORTED_STYLE_PROPS[number]

/**
 * @deprecated Use withUnistyles instead
 */
export const createUnistylesComponent = <TProps extends Record<string, any>, TMappings extends Partial<Omit<TProps, SupportedStyleProps>>>(Component: ComponentType<TProps>, mappings?: (theme: UnistylesTheme) => TMappings) => {
    return withUnistyles(Component, mappings as any)
}
