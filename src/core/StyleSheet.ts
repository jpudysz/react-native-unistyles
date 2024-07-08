import type { StyleSheetWithSuperPowers } from '../types'
import type { UnistylesThemes } from 'react-native-unistyles'

type UnistylesConfig = {
    themes: UnistylesThemes
}

const create = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet

export type UnistylesStyleSheet = {
    create: typeof create,
    configure(config: UnistylesConfig): void
}
