import { getMediaQuery } from '../utils'
import type { CSSState } from './state'

export const convertToCSS = (hash: string, value: Record<string, any>, state: CSSState) => {
    Object.entries(value).forEach(([styleKey, styleValue]) => {
        if (styleKey[0] === '_') {
            const pseudoClassName = styleKey.replace('_', `${hash}:`)

            Object.entries(styleValue).forEach(([pseudoStyleKey, pseudoStyleValue]) => {
                if (typeof pseudoStyleValue === 'object' && pseudoStyleValue !== null) {
                    const allBreakpoints = Object.keys(styleValue)
                    Object.entries(pseudoStyleValue).forEach(([breakpointStyleKey, breakpointStyleValue]) => {
                        const mediaQuery = getMediaQuery(pseudoStyleKey, allBreakpoints)

                        state.set({
                            mediaQuery,
                            className: pseudoClassName,
                            propertyKey: breakpointStyleKey,
                            value: breakpointStyleValue,
                        })
                    })

                    return
                }

                state.set({
                    className: pseudoClassName,
                    propertyKey: pseudoStyleKey,
                    value: pseudoStyleValue,
                })
            })

            return
        }

        if (typeof styleValue === 'object') {
            const allBreakpoints = Object.keys(value)
            Object.entries(styleValue).forEach(([breakpointStyleKey, breakpointStyleValue]) => {
                const mediaQuery = getMediaQuery(styleKey, allBreakpoints)

                state.set({
                    mediaQuery,
                    className: hash,
                    propertyKey: breakpointStyleKey,
                    value: breakpointStyleValue,
                })
            })

            return
        }

        state.set({
            className: hash,
            propertyKey: styleKey,
            value: styleValue,
        })
    })
}
