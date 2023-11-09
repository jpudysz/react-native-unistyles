type Optional<TOptional extends string> = TOptional | ''
type Separator = ',' | ', '
type OpeningBracket = '(' | '['
type ClosingBracket = ')' | ']'

type NumericMediaQuery =
    | `${OpeningBracket}${Separator}${bigint}${ClosingBracket}`
    | `${OpeningBracket}${bigint}${Optional<`${Separator}${bigint}`>}${ClosingBracket}`

type WidthMediaQuery = `:w${NumericMediaQuery}`
type HeightMediaQuery = `:h${NumericMediaQuery}`

export type MediaQueries =
    | `${WidthMediaQuery}${Optional<HeightMediaQuery>}`
    | `${HeightMediaQuery}${Optional<WidthMediaQuery>}`
