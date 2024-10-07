// TODO: Add complete list of pseudo selectors
export const pseudos = [
    '_hover',
    '_css',
    '_before',
    '_after'
] as const

export const isPseudo = (selector: string) => pseudos.includes(selector as Pseudo)

export type Pseudo = typeof pseudos[number]
