import { media } from 'typestyle'
import type { NestedCSSProperties } from 'typestyle/lib/types'
import { deepMergeObjects, warn } from '../utils'
import { validateShadow } from './shadow'
import { convertBreakpoint } from './breakpoint'
import { TEXT_SHADOW_STYLES, type TextShadow } from './types'
import { extractShadowValue, normalizeColor, normalizeNumericValue } from './utils'

const createTextShadowValue = (style: TextShadow) => {
    const { textShadowColor, textShadowOffset, textShadowRadius } = style
    const offsetX = normalizeNumericValue(textShadowOffset.width)
    const offsetY = normalizeNumericValue(textShadowOffset.height)
    const radius = normalizeNumericValue(textShadowRadius)
    const color = normalizeColor(textShadowColor as string)

    return `${offsetX} ${offsetY} ${radius} ${color}`
}

export const getTextShadowStyle = (styles: Record<string, any>): NestedCSSProperties => {
    const missingStyles = TEXT_SHADOW_STYLES.filter(key => !(key in styles))

    if (missingStyles.length) {
        warn(`can't apply text shadow as you miss these properties: ${missingStyles.join(', ')}`)

        return {}
    }

    const breakpointsSet = new Set<string>()

    try {
        validateShadow(TEXT_SHADOW_STYLES, styles, breakpointsSet)
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
            textShadow: createTextShadowValue(styles as TextShadow)
        }
    }

    // Create textShadow for each breakpoint
    const breakpointStyles = breakpoints.map(breakpoint => {
        const color = extractShadowValue('textShadowColor', breakpoint, styles)
        const { width, height } = extractShadowValue('textShadowOffset', breakpoint, styles)
        const radius = extractShadowValue('textShadowRadius', breakpoint, styles)

        return media(convertBreakpoint(breakpoint), {
            textShadow: createTextShadowValue({
                textShadowColor: color,
                textShadowOffset: {
                    width,
                    height
                },
                textShadowRadius: radius
            })
        })
    })

    // Merge all breakpoints styles into one
    return deepMergeObjects(...breakpointStyles)
}
