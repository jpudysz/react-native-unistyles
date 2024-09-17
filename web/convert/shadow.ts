import type { ShadowOffset } from './types'

export const validateShadow = (shadowProperties: ReadonlyArray<string>, styles: Record<string, any>, breakpoints: Set<string>) => {
    // Collect breakpoints
    shadowProperties.forEach(key => {
        const value = styles[key]

        if (typeof value !== 'object') {
            return
        }

        if (key === 'shadowOffset' || key === 'textShadowOffset') {
            const { width, height } = value as ShadowOffset

            // If shadowOffset.width has breakpoints
            if (typeof width === 'object') {
                Object.keys(width).forEach(breakpoint => breakpoints.add(breakpoint))
            }

            // If shadowOffset.height has breakpoints
            if (typeof height === 'object') {
                Object.keys(height).forEach(breakpoint => breakpoints.add(breakpoint))
            }

            return
        }

        // Collect regular breakpoints
        Object.keys(value).forEach(breakpoint => breakpoints.add(breakpoint))
    })

    // Validate if all breakpoints are present
    shadowProperties.forEach(key => {
        const value = styles[key]

        if (typeof value !== 'object') {
            return
        }

        if (key === 'shadowOffset' || key === 'textShadowOffset') {
            const { width, height } = value as ShadowOffset

            if (typeof width === 'object') {
                const missingBreakpoints = Array.from(breakpoints).filter(breakpoint => !(breakpoint in width))

                if (missingBreakpoints.length) {
                    throw `missing breakpoints in ${key}.width: ${missingBreakpoints.join(', ')}`
                }
            }

            if (typeof height === 'object') {
                const missingBreakpoints = Array.from(breakpoints).filter(breakpoint => !(breakpoint in height))

                if (missingBreakpoints.length) {
                    throw `missing breakpoints in ${key}.height: ${missingBreakpoints.join(', ')}`
                }
            }

            return
        }

        const missingBreakpoints = Array.from(breakpoints).filter(breakpoint => !(breakpoint in value))

        if (missingBreakpoints.length) {
            throw `missing breakpoints in ${key}: ${missingBreakpoints.join(', ')}`
        }
    })
}
