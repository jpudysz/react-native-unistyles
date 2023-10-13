type Optional<TOptional extends string> = TOptional | ''
type Separator = ',' | ', '
type MediaQuery = `[${Separator}${bigint}]` | `[${bigint}${Optional<`${Separator}${bigint}`>}]`
type WidthMediaQuery = `:w${MediaQuery}`
type HeightMediaQuery = `:h${MediaQuery}`

// this is super weird, but number passes empty string and bigint does not
export type MediaQueries =
    | `${WidthMediaQuery}${Optional<HeightMediaQuery>}`
    | `${HeightMediaQuery}${Optional<WidthMediaQuery>}`
