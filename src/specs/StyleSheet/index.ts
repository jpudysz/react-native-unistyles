import type { StyleSheet as StyleSheetSpec } from './StyleSheet.nitro'
import type { StyleSheetWithSuperPowers } from '../../types'
import type { UnistylesThemes } from '../../global'

type AbsoluteFillObject = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
}

type UnistylesConfig = {
    themes: UnistylesThemes
}

const create = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet

export type UnistylesStyleSheet = {
    create: typeof create,
    configure(config: UnistylesConfig): void
}

// todo implement me
export interface StyleSheet extends StyleSheetSpec {
    hairlineWidth: number,
    absoluteFillObject: AbsoluteFillObject,
    absoluteFill: AbsoluteFillObject,
    compose: VoidFunction,
    flatten: VoidFunction,
    create: typeof create
}
