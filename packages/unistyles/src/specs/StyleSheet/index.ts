import type { StyleSheet as NativeStyleSheetType } from 'react-native'

import { StyleSheet as NativeStyleSheet, processColor } from 'react-native'
import { NitroModules } from 'react-native-nitro-modules'

import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { CreateUnistylesStyleSheet } from '../../types'
import type { UnistylesStyleSheet as UnistylesStyleSheetSpec } from './UnistylesStyleSheet.nitro'

import { parseBoxShadowString } from '../../core/parseBoxShadow'

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

// `absoluteFill` may resolve to a registered numeric style id (web / older RN), so keep
// `absoluteFillObject` a real descriptor object to stay spreadable and match RN's contract
const absoluteFillObject = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
} as const

export interface UnistylesStyleSheet extends UnistylesStyleSheetSpec {
    absoluteFillObject: typeof absoluteFillObject
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
    }
}

const HybridUnistylesStyleSheet = NitroModules.createHybridObject<UnistylesStyleSheet>('UnistylesStyleSheet')

HybridUnistylesStyleSheet.absoluteFillObject = absoluteFillObject
HybridUnistylesStyleSheet.absoluteFill = NativeStyleSheet.absoluteFill
HybridUnistylesStyleSheet.flatten = NativeStyleSheet.flatten
HybridUnistylesStyleSheet.compose = NativeStyleSheet.compose
HybridUnistylesStyleSheet.jsMethods = {
    processColor,
    parseBoxShadowString,
}

HybridUnistylesStyleSheet.init()

type PrivateMethods = 'jsMethods' | 'init'

export const StyleSheet = HybridUnistylesStyleSheet as Omit<UnistylesStyleSheet, PrivateMethods>
