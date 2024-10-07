import { NitroModules } from 'react-native-nitro-modules'
import { processColor, StyleSheet as NativeStyleSheet } from 'react-native'
import type { StyleSheet as NativeStyleSheetType } from 'react-native'
import type { UnistylesStyleSheet as UnistylesStyleSheetSpec } from './UnistylesStyleSheet.nitro'
import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { CreateUnistylesStyleSheet } from '../../types'

type UnistylesSettings = {
    adaptiveThemes?: boolean,
    initialTheme?: (() => keyof UnistylesThemes) | keyof UnistylesThemes
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

type PrivateMethods = 'jsMethods'

export const StyleSheet = HybridUnistylesStyleSheet as Omit<UnistylesStyleSheet, PrivateMethods>
