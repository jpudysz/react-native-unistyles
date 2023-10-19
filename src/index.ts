export { UnistylesTheme } from './UnistylesTheme'
export { createUnistyles } from './createUnistyles'

type ThemeShape = {
    [key: string]: boolean | string | number | null | undefined | ThemeShape
}

export const Unistyles = {
    Static: {
        registerBreakpoints: (bp: Record<string, number>, sortedMap?: Array<[string, number]>) => {
            console.log(bp)
            console.log(sortedMap)
        },
        registerThemes: (themesMap: Record<string, ThemeShape>) => {
            console.log(themesMap)
        }
    }
}
