import type { UnistylesRuntime as UnistylesRuntimeSpec } from './UnistylesRuntime.nitro'
import type { MiniRuntime as MiniRuntimeSpec } from './MiniRuntime.nitro'
import type { AppBreakpoint, AppTheme, AppThemeName, ColorScheme, Orientation } from '../types'
import type { AndroidContentSizeCategory, IOSContentSizeCategory } from '../../types'
import type { StatusBar } from '../StatusBar'
import type { NavigationBar } from '../NavigtionBar'

export interface UnistylesRuntime extends UnistylesRuntimeSpec {
    readonly colorScheme: ColorScheme,
    readonly themeName?: AppThemeName,
    readonly contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory,
    readonly breakpoint?: AppBreakpoint,
    readonly orientation: Orientation,

    // other HybridObjects
    statusBar: StatusBar,
    navigationBar: NavigationBar,

    setTheme(themeName: AppThemeName): void
    updateTheme(themeName: AppThemeName, updater: (currentTheme: AppTheme) => AppTheme): void,
    setRootViewBackgroundColor(hex?: `#${string}`, alpha?: number): void
}

export interface MiniRuntime extends MiniRuntimeSpec {
    readonly colorScheme: ColorScheme,
    readonly themeName?: AppThemeName,
    readonly contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory,
    readonly breakpoint?: AppBreakpoint,
    readonly orientation: Orientation,
}
