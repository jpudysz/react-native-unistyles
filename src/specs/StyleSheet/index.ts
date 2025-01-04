import { NitroModules } from 'react-native-nitro-modules'
import { processColor, StyleSheet as NativeStyleSheet } from 'react-native'
import type { StyleSheet as NativeStyleSheetType } from 'react-native'
import type { UnistylesStyleSheet as UnistylesStyleSheetSpec } from './UnistylesStyleSheet.nitro'
import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { CreateUnistylesStyleSheet } from '../../types'

type UnistylesThemeSettings = {
    initialTheme: (() => keyof UnistylesThemes) | keyof UnistylesThemes
} | {
    adaptiveThemes: boolean
}

type UnistylesSettings = UnistylesThemeSettings & {
    CSSVars?: boolean
}

export type UnistylesConfig = {
    settings?: UnistylesSettings,
    themes?: UnistylesThemes,
    breakpoints?: UnistylesBreakpoints
}

export interface UnistylesStyleSheet extends UnistylesStyleSheetSpec {
    absoluteFillObject: typeof NativeStyleSheetType.absoluteFillObject,
    absoluteFill: typeof NativeStyleSheetType.absoluteFill,
    compose: typeof NativeStyleSheetType.compose,
    flatten: typeof NativeStyleSheetType.flatten,

    // overridden methods
    init(): void,
    create: CreateUnistylesStyleSheet,
    configure(config: UnistylesConfig): void,
    jsMethods: {
        processColor: typeof processColor
    }
}

const HybridUnistylesStyleSheet = NitroModules
    .createHybridObject<UnistylesStyleSheet>('UnistylesStyleSheet')

HybridUnistylesStyleSheet.absoluteFillObject = NativeStyleSheet.absoluteFillObject
HybridUnistylesStyleSheet.absoluteFill = NativeStyleSheet.absoluteFill
HybridUnistylesStyleSheet.flatten = NativeStyleSheet.flatten
HybridUnistylesStyleSheet.compose = NativeStyleSheet.compose
HybridUnistylesStyleSheet.jsMethods = {
    processColor
}

HybridUnistylesStyleSheet.init()

type PrivateMethods = 'jsMethods' | 'addChangeListener' | 'init'

export const StyleSheet = HybridUnistylesStyleSheet as Omit<UnistylesStyleSheet, PrivateMethods>
