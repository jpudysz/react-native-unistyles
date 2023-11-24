import type { StyleSheetWithSuperPowers } from './types'

export const createStyleSheet = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet
