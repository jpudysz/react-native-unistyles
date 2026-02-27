import { deepMergeObjects } from '../../../utils'
import { BOX_SHADOW_STYLES, type BoxShadow } from '../types'
import { extractShadowValue, normalizeColor, normalizeNumericValue } from '../utils'
import { getShadowBreakpoints } from './getShadowBreakpoints'

const createBoxShadowValue = (style: BoxShadow) => {
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = style
    const offsetX = normalizeNumericValue(shadowOffset?.width ?? 0)
    const offsetY = normalizeNumericValue(shadowOffset?.height ?? 0)
    const radius = normalizeNumericValue(shadowRadius ?? 0)
    const color = normalizeColor((shadowColor ?? '#000000') as string, (shadowOpacity ?? 1) as number)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

export const getBoxShadowStyle = (styles: Record<string, any>) => {
    const breakpoints = getShadowBreakpoints(BOX_SHADOW_STYLES, styles)

    // If no breakpoints were used return styles without media queries
    if (breakpoints.length === 0) {
        return {
            boxShadow: createBoxShadowValue(styles as BoxShadow),
        }
    }

    // Create boxShadow for each breakpoint
    const breakpointStyles = breakpoints.map((breakpoint) => {
        const color = extractShadowValue('shadowColor', breakpoint, styles)
        const { width, height } = extractShadowValue('shadowOffset', breakpoint, styles)
        const radius = extractShadowValue('shadowRadius', breakpoint, styles)
        const opacity = extractShadowValue('shadowOpacity', breakpoint, styles)

        return {
            [breakpoint]: {
                boxShadow: createBoxShadowValue({
                    shadowColor: color,
                    shadowOffset: {
                        width,
                        height,
                    },
                    shadowRadius: radius,
                    shadowOpacity: opacity,
                }),
            },
        }
    })

    // Merge all breakpoints styles into one
    return deepMergeObjects(...breakpointStyles)
}
