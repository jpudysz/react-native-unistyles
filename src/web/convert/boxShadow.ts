import { deepMergeObjects, warn } from '../utils'
import { validateShadow } from './shadow'
import { BOX_SHADOW_STYLES, type BoxShadow } from './types'
import { extractShadowValue, normalizeColor, normalizeNumericValue } from './utils'

const createBoxShadowValue = (style: BoxShadow) => {
    // at this point every prop is present
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = style
    const offsetX = normalizeNumericValue(shadowOffset.width)
    const offsetY = normalizeNumericValue(shadowOffset.height)
    const radius = normalizeNumericValue(shadowRadius)
    const color = normalizeColor(shadowColor as string, shadowOpacity as number)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

export const getBoxShadowStyle = (styles: Record<string, any>) => {
    const missingStyles = BOX_SHADOW_STYLES.filter(key => !(key in styles))

    if (missingStyles.length) {
        warn(`can't apply box shadow as you miss these properties: ${missingStyles.join(', ')}`)

        return {}
    }

    const breakpointsSet = new Set<string>()

    try {
        validateShadow(BOX_SHADOW_STYLES, styles, breakpointsSet)
    } catch (error) {
        if (typeof error === 'string') {
            warn(error)
        }

        return {}
    }

    const breakpoints = Array.from(breakpointsSet)

    // If no breakpoints were used return styles without media queries
    if (breakpoints.length === 0) {
        return {
            boxShadow: createBoxShadowValue(styles as BoxShadow)
        }
    }

    // Create boxShadow for each breakpoint
    const breakpointStyles = breakpoints.map(breakpoint => {
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
                        height
                    },
                    shadowRadius: radius,
                    shadowOpacity: opacity
                })
            }
        }
    })

    // Merge all breakpoints styles into one
    return deepMergeObjects(...breakpointStyles)
}
