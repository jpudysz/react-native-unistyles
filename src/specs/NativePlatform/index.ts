import type { ColorScheme, Orientation } from 'react-native-unistyles'
import type { AppBreakpoint, AppThemeName } from '../types'
import type { AndroidContentSizeCategory, IOSContentSizeCategory, WebContentSizeCategory } from '../../types'
import type { UnistylesMiniRuntime as UnistylesMiniRuntimeSpec } from './NativePlatform.nitro'

export interface MiniRuntime extends UnistylesMiniRuntimeSpec {
    readonly colorScheme: ColorScheme,
    readonly themeName?: AppThemeName,
    readonly contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory | WebContentSizeCategory,
    readonly breakpoint?: AppBreakpoint,
    readonly orientation: Orientation,
}

export type { NativePlatform } from './NativePlatform.nitro'
