import type { ShadowStyleIOS, TextStyle, TransformsStyle } from 'react-native'

type TransformArrayElement<T> = T extends Array<infer U> ? U : never
type BoxShadow = Required<ShadowStyleIOS>
type TextShadow = Required<Pick<TextStyle, 'textShadowColor' | 'textShadowOffset' | 'textShadowRadius'>>
type Transforms = Array<TransformArrayElement<TransformsStyle['transform']>>

type NormalizedBoxShadow = {
    shadowColor: undefined,
    shadowOffset: undefined,
    shadowOpacity: undefined,
    shadowRadius: undefined,
    boxShadow?: string
}

type NormalizedTextShadow = {
    textShadowColor: undefined
    textShadowOffset: undefined
    textShadowRadius: undefined,
    textShadow?: string
}

export type {
    BoxShadow,
    TextShadow,
    Transforms,
    NormalizedBoxShadow,
    NormalizedTextShadow
}
