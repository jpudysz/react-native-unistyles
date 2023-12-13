import type { StyleSheetWithSuperPowers } from './types'

/**
 * Utility to create a stylesheet with superpowers
 * Compatible with React Native StyleSheet.create
 * @param stylesheet - The stylesheet with superpowers to be used
 */
export const createStyleSheet = <S extends StyleSheetWithSuperPowers>(stylesheet: S): S => stylesheet
