import type { StyleSheetWithSuperPowers } from '../types'

const create = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet

export type UnistylesStyleSheet = {
    create: typeof create
}
