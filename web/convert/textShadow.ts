import type { TextStyle } from 'react-native'
import type { UnistylesValues } from '../../src/types'
import type { ToDeepUnistyles } from '../../src/types/stylesheet'
import { deepMergeObjects, warn } from '../utils'
import { normalizeColor, normalizeNumericValue } from './utils'
import type { NestedCSSProperties } from 'typestyle/lib/types'
import { media } from 'typestyle'
import { convertBreakpoint } from './breakpoint'

export const TEXT_SHADOW_STYLES = ['textShadowColor', 'textShadowOffset', 'textShadowRadius'] as const

const validateTextShadowStyle = (styles: UnistylesValues, breakpoints: Set<string>) => {
   // Collect breakpoints
    TEXT_SHADOW_STYLES.forEach(key => {
        const value = styles[key]

        if (typeof value !== 'object') {
            return
        }

        if (key === 'textShadowOffset') {
            const { width, height } = value as ToDeepUnistyles<{ width: number, height: number }>

            // If textShadowOffset.width has breakpoints
            if (typeof width === 'object') {
                Object.keys(width).forEach(breakpoint => breakpoints.add(breakpoint))
            }

            // If textShadowOffset.height has breakpoints
            if (typeof height === 'object') {
                Object.keys(height).forEach(breakpoint => breakpoints.add(breakpoint))
            }

            return
        }

        // Collect textShadowRadius and textShadowColor breakpoints
        Object.keys(value).forEach(breakpoint => breakpoints.add(breakpoint))
    })

    // Validate if all breakpoints are present
    TEXT_SHADOW_STYLES.forEach(key => {
        const value = styles[key]

        if (typeof value !== 'object') {
            return
        }

        if (key === 'textShadowOffset') {
            const { width, height } = value as ToDeepUnistyles<{ width: number, height: number }>

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

type TextShadow = Required<Pick<TextStyle, 'textShadowColor' | 'textShadowOffset' | 'textShadowRadius'>>

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
        validateTextShadowStyle(styles, breakpointsSet)
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
        const color = typeof styles.textShadowColor === 'object'
            ? styles.textShadowColor[breakpoint]
            : styles.textShadowColor
        const width = typeof styles.textShadowOffset?.width === 'object'
            ? styles.textShadowOffset.width[breakpoint]
            : styles.textShadowOffset.width
        const height = typeof styles.textShadowOffset?.height === 'object'
            ? styles.textShadowOffset.height[breakpoint]
            : styles.textShadowOffset.height
        const radius = typeof styles.textShadowRadius === 'object'
            ? styles.textShadowRadius[breakpoint]
            : styles.textShadowRadius

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
