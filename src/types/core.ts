import type {
    MatrixTransform,
    PerpectiveTransform,
    RotateTransform,
    RotateXTransform,
    RotateYTransform,
    RotateZTransform,
    ScaleTransform,
    ScaleXTransform,
    ScaleYTransform,
    SkewXTransform,
    SkewYTransform,
    TranslateXTransform,
    TranslateYTransform
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { UnistylesBreakpoints, UnistylesThemes } from '../global'

export type ShadowOffset = {
    width: number,
    height: number
}

export type TransformStyles =
    & PerpectiveTransform
    & RotateTransform
    & RotateXTransform
    & RotateYTransform
    & RotateZTransform
    & ScaleTransform
    & ScaleXTransform
    & ScaleYTransform
    & TranslateXTransform
    & TranslateYTransform
    & SkewXTransform
    & SkewYTransform
    & MatrixTransform

export type ScreenSize = {
    width: number,
    height: number
}

export type RNStyle = ViewStyle & TextStyle & ImageStyle
export type RNValue = ViewStyle[keyof ViewStyle] | TextStyle[keyof TextStyle] | ImageStyle[keyof ImageStyle]
export type NestedStyle = Record<keyof UnistylesBreakpoints | symbol, RNValue>
export type NestedStylePairs = Array<[keyof UnistylesBreakpoints | symbol, RNValue]>
export type UnistylesTheme = UnistylesThemes[keyof UnistylesThemes]
