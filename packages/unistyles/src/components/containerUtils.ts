export const getBreakpointFromWidth = (
    width: number,
    breakpoints: Record<string, number | undefined>
): string | undefined => {
    const sorted = Object.entries(breakpoints)
        .filter((pair): pair is [string, number] => pair[1] !== undefined)
        .sort(([, a], [, b]) => a - b)

    if (sorted.length === 0) {
        return undefined
    }

    const idx = sorted.findIndex(([, value]) => width < value)

    if (idx <= 0) {
        return sorted[0]?.[0]
    }

    return sorted[idx - 1]![0]
}
