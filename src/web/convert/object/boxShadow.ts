import type { BoxShadowValue } from 'react-native'

import { deepMergeObjects } from '../../../utils'
import { keyInObject } from '../../utils'
import { normalizeNumericValue } from '../utils'

const createBoxShadowValue = (style: BoxShadowValue) => {
    const { offsetX, offsetY, blurRadius = 0, spreadDistance = 0, color = '#000', inset } = style

    return `${inset ? 'inset ' : ''}${normalizeNumericValue(offsetX)} ${normalizeNumericValue(offsetY)} ${normalizeNumericValue(blurRadius as number)} ${normalizeNumericValue(spreadDistance as number)} ${color}`
}

export const getBoxShadow = (boxShadow: Array<BoxShadowValue>) => {
    const breakpoints = new Set<string>()
    boxShadow.forEach((shadow) => {
        const [key] = Object.keys(shadow)
        const value = shadow[key as keyof BoxShadowValue]

        // Breakpoints
        if (typeof value === 'object') {
            Object.keys(value).forEach((breakpoint) => breakpoints.add(breakpoint))
        }
    })

    if (breakpoints.size === 0) {
        const boxShadowStyle = Object.fromEntries(
            boxShadow.map((shadow) => {
                const [key] = Object.keys(shadow)
                return [key, shadow[key as keyof BoxShadowValue]]
            }),
        ) as BoxShadowValue

        return {
            boxShadow: createBoxShadowValue(boxShadowStyle),
        }
    }

    const breakpointStyles = Array.from(breakpoints).map((breakpoint) => {
        const styles = Object.fromEntries(
            boxShadow.map((shadow) => {
                const [key] = Object.keys(shadow)
                const value = shadow[key as keyof BoxShadowValue]

                if (typeof value === 'object' && keyInObject(value, breakpoint)) {
                    return [key, value[breakpoint]]
                }

                return [key, value]
            }),
        ) as BoxShadowValue

        return {
            [breakpoint]: {
                boxShadow: createBoxShadowValue(styles),
            },
        }
    })

    return deepMergeObjects(...breakpointStyles)
}
