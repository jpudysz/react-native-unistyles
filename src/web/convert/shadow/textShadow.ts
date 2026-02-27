import { deepMergeObjects } from '../../../utils'
import { TEXT_SHADOW_STYLES, type TextShadow } from '../types'
import { extractShadowValue, normalizeColor, normalizeNumericValue } from '../utils'
import { getShadowBreakpoints } from './getShadowBreakpoints'

const createTextShadowValue = (style: TextShadow) => {
    const { textShadowColor, textShadowOffset, textShadowRadius } = style
    const offsetX = normalizeNumericValue(textShadowOffset?.width ?? 0)
    const offsetY = normalizeNumericValue(textShadowOffset?.height ?? 0)
    const radius = normalizeNumericValue(textShadowRadius ?? 0)
    const color = normalizeColor((textShadowColor ?? '#000000') as string)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

export const getTextShadowStyle = (styles: Record<string, any>) => {
    const breakpoints = getShadowBreakpoints(TEXT_SHADOW_STYLES, styles)

    // If no breakpoints were used return styles without media queries
    if (breakpoints.length === 0) {
        return {
            textShadow: createTextShadowValue(styles as TextShadow),
        }
    }

    // Create textShadow for each breakpoint
    const breakpointStyles = breakpoints.map((breakpoint) => {
        const color = extractShadowValue('textShadowColor', breakpoint, styles)
        const { width, height } = extractShadowValue('textShadowOffset', breakpoint, styles)
        const radius = extractShadowValue('textShadowRadius', breakpoint, styles)

        return {
            [breakpoint]: {
                textShadow: createTextShadowValue({
                    textShadowColor: color,
                    textShadowOffset: {
                        width,
                        height,
                    },
                    textShadowRadius: radius,
                }),
            },
        }
    })

    // Merge all breakpoints styles into one
    return deepMergeObjects(...breakpointStyles)
}
