import type { StyleSheet as NativeStyleSheet } from 'react-native'
import type { StyleSheet as StyleSheetSpec } from './StyleSheet.nitro'
import type { StyleSheetWithSuperPowers } from '../../types'
import type { UnistylesBreakpoints, UnistylesThemes } from '../../global'

type UnistylesSettings = {
    adaptiveThemes?: boolean,
    initialTheme?: (() => keyof UnistylesThemes) | keyof UnistylesThemes
}

type UnistylesConfig = {
    settings?: UnistylesSettings,
    themes?: UnistylesThemes,
    breakpoints?: UnistylesBreakpoints
}

const create = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet

export interface StyleSheet extends StyleSheetSpec {
    absoluteFillObject: typeof NativeStyleSheet.absoluteFillObject,
    absoluteFill: typeof NativeStyleSheet.absoluteFill,
    compose: typeof NativeStyleSheet.compose,
    flatten: typeof NativeStyleSheet.flatten,

    // overridden methods
    create: typeof create,
    configure(config: UnistylesConfig): void
}
