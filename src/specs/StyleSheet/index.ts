import type { StyleSheet as NativeStyleSheet } from 'react-native'
import type { StyleSheet as StyleSheetSpec } from './StyleSheet.nitro'
import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'
import type { CreateUnistylesStyleSheet } from '../../types'

type UnistylesSettings = {
    adaptiveThemes?: boolean,
    initialTheme?: (() => keyof UnistylesThemes) | keyof UnistylesThemes
}

type UnistylesConfig = {
    settings?: UnistylesSettings,
    themes?: UnistylesThemes,
    breakpoints?: UnistylesBreakpoints
}

export interface StyleSheet extends StyleSheetSpec {
    absoluteFillObject: typeof NativeStyleSheet.absoluteFillObject,
    absoluteFill: typeof NativeStyleSheet.absoluteFill,
    compose: typeof NativeStyleSheet.compose,
    flatten: typeof NativeStyleSheet.flatten,

    // overridden methods
    create: CreateUnistylesStyleSheet,
    configure(config: UnistylesConfig): void
}
