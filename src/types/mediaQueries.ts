type Optional<TOptional extends string> = TOptional | ''
type Separator = ',' | ', '
// this is super weird, but number passes empty string and bigint does not
type MediaQuery = `[${Separator}${bigint}]` | `[${bigint}${Optional<`${Separator}${bigint}`>}]`
type WidthMediaQuery = `:w${MediaQuery}`
type HeightMediaQuery = `:h${MediaQuery}`

export type MediaQueries =
    | `${WidthMediaQuery}${Optional<HeightMediaQuery>}`
    | `${HeightMediaQuery}${Optional<WidthMediaQuery>}`
