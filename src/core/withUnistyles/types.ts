import type { UnistylesMiniRuntime } from '../../specs';
import type { UnistylesTheme } from '../../types';

export const SUPPORTED_STYLE_PROPS = ['style', 'contentContainerStyle'] as const

export type SupportedStyleProps = typeof SUPPORTED_STYLE_PROPS[number]
export type Mappings<T = {}> = (theme: UnistylesTheme, rt: UnistylesMiniRuntime) => Omit<Partial<T>, SupportedStyleProps>
