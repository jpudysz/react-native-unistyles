import type { ShadowOffset } from '../types'

export const getShadowBreakpoints = (shadowProperties: ReadonlyArray<string>, styles: Record<string, any>) => {
    const breakpoints = new Set<string>()

    shadowProperties.forEach((key) => {
        const value = styles[key]

        if (typeof value !== 'object') {
            return
        }

        if (key === 'shadowOffset' || key === 'textShadowOffset') {
            const { width, height } = value as ShadowOffset

            // If shadowOffset.width has breakpoints
            if (typeof width === 'object') {
                Object.keys(width).forEach((breakpoint) => breakpoints.add(breakpoint))
            }

            // If shadowOffset.height has breakpoints
            if (typeof height === 'object') {
                Object.keys(height).forEach((breakpoint) => breakpoints.add(breakpoint))
            }

            return
        }

        // Collect regular breakpoints
        Object.keys(value).forEach((breakpoint) => breakpoints.add(breakpoint))
    })

    return Array.from(breakpoints)
}
