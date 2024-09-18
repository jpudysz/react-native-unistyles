import { NitroModules } from 'react-native-nitro-modules'
import type { UnistylesRuntime as UnistylesRuntimeSpec, UnistylesMiniRuntime } from './UnistylesRuntime.nitro'
import type { AppBreakpoint, AppTheme, AppThemeName, ColorScheme, Orientation } from '../types'
import { attachStatusBarJSMethods, type UnistylesStatusBar } from '../StatusBar'
import type { UnistylesNavigationBar } from '../NavigtionBar'
import type { AndroidContentSizeCategory, IOSContentSizeCategory } from '../../types'
import { isIOS } from '../../common'

export interface UnistylesRuntimePrivate extends Omit<UnistylesRuntimeSpec, 'setRootViewBackgroundColor'> {
    readonly colorScheme: ColorScheme,
    readonly themeName?: AppThemeName,
    readonly contentSizeCategory: IOSContentSizeCategory | AndroidContentSizeCategory,
    readonly breakpoint?: AppBreakpoint,
    readonly orientation: Orientation,

    // other HybridObjects
    statusBar: UnistylesStatusBar,
    navigationBar: UnistylesNavigationBar,

    setTheme(themeName: AppThemeName): void
    updateTheme(themeName: AppThemeName, updater: (currentTheme: AppTheme) => AppTheme): void,
    setRootViewBackgroundColor(color?: string): void

    // constructors
    createHybridStatusBar(): UnistylesStatusBar,
    createHybridNavigationBar(): UnistylesNavigationBar
}

type UnistylesRuntime = Omit<UnistylesRuntimePrivate, 'createHybridStatusBar' | 'createHybridNavigationBar' | 'dispose' | 'miniRuntime'>

const HybridUnistylesRuntime = NitroModules
    .createHybridObject<UnistylesRuntimePrivate>('UnistylesRuntime')

HybridUnistylesRuntime.statusBar = HybridUnistylesRuntime.createHybridStatusBar()
HybridUnistylesRuntime.navigationBar = HybridUnistylesRuntime.createHybridNavigationBar()

if (isIOS) {
    HybridUnistylesRuntime.setImmersiveMode = (isEnabled: boolean) => HybridUnistylesRuntime.statusBar.setHidden(isEnabled, 'fade')
}

attachStatusBarJSMethods(HybridUnistylesRuntime.statusBar)

export const Runtime = HybridUnistylesRuntime as UnistylesRuntime

export type {
    UnistylesMiniRuntime
}
