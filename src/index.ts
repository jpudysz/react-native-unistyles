export { UnistylesTheme } from './UnistylesTheme'
export { createUnistyles } from './createUnistyles'

export const Unistyles = {
    Static: {
        registerBreakpoints: (bp: Record<string, number>, sortedMap?: Array<[string, number]>) => {
            console.log(bp)
            console.log(sortedMap)
        }
    }
}
