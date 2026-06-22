import type { StyleSheet as NativeStyleSheetType } from 'react-native'

import { StyleSheet as NativeStyleSheet, processColor } from 'react-native'
import { NitroModules } from 'react-native-nitro-modules'

import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { CreateUnistylesStyleSheet } from '../../types'
import type { UnistylesStyleSheet as UnistylesStyleSheetSpec } from './UnistylesStyleSheet.nitro'

import { parseBoxShadowString } from '../../core/parseBoxShadow'
// React Native has no public export for its background-image parser, but it is the
// same processor the core renderer applies, so reusing it produces the exact array
// shape native expects (the raw CSS string crashes the Android RCTView prop setter).
// @ts-ignore - deep import has no type declarations
import processBackgroundImage from 'react-native/Libraries/StyleSheet/processBackgroundImage'

type UnistylesThemeSettings =
    | {
          initialTheme: (() => keyof UnistylesThemes) | keyof UnistylesThemes
          adaptiveThemes?: never | false
      }
    | {
          adaptiveThemes: boolean
          initialTheme?: never
      }
    | {
          adaptiveThemes?: never
          initialTheme?: never
      }

type UnistylesSettings = UnistylesThemeSettings & {
    CSSVars?: boolean
    nativeBreakpointsMode?: 'pixels' | 'points'
}

export type UnistylesConfig = {
    settings?: UnistylesSettings
    themes?: UnistylesThemes
    breakpoints?: UnistylesBreakpoints
}

export interface UnistylesStyleSheet extends UnistylesStyleSheetSpec {
    absoluteFillObject: typeof NativeStyleSheetType.absoluteFill
    absoluteFill: typeof NativeStyleSheetType.absoluteFill
    compose: typeof NativeStyleSheetType.compose
    flatten: typeof NativeStyleSheetType.flatten

    // overridden methods
    init(): void
    create: CreateUnistylesStyleSheet
    configure(config: UnistylesConfig): void
    jsMethods: {
        processColor: typeof processColor
        parseBoxShadowString: typeof parseBoxShadowString
        processBackgroundImage: typeof processBackgroundImage
    }
}

const HybridUnistylesStyleSheet = NitroModules.createHybridObject<UnistylesStyleSheet>('UnistylesStyleSheet')

HybridUnistylesStyleSheet.absoluteFillObject = NativeStyleSheet.absoluteFill
HybridUnistylesStyleSheet.absoluteFill = NativeStyleSheet.absoluteFill
HybridUnistylesStyleSheet.flatten = NativeStyleSheet.flatten
HybridUnistylesStyleSheet.compose = NativeStyleSheet.compose
HybridUnistylesStyleSheet.jsMethods = {
    processColor,
    parseBoxShadowString,
    processBackgroundImage,
}

HybridUnistylesStyleSheet.init()

type PrivateMethods = 'jsMethods' | 'init'

export const StyleSheet = HybridUnistylesStyleSheet as Omit<UnistylesStyleSheet, PrivateMethods>
