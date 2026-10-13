import type { CSSState } from './state'

import { isPseudoClass } from '../convert/pseudo'
import { getMediaQuery } from '../utils'

type SetProps = Parameters<CSSState['set']>[0]

// box-none and box-only aren't CSS values, polyfill them like react-native-web: [element, children]
const POINTER_EVENTS: Record<string, [string, string]> = {
    'box-none': ['none', 'auto'],
    'box-only': ['auto', 'none'],
}

export const getChildrenClassName = (className: string) => `:where(.${className})>*`

const setStyle = (state: CSSState, props: SetProps) => {
    if (props.propertyKey !== 'pointerEvents') {
        state.set(props)

        return
    }

    const [value, childrenValue] = POINTER_EVENTS[props.value] ?? [props.value]

    state.set({ ...props, value })
    // :where() has no specificity, so a child's own pointerEvents always wins
    // set it for every value, so re-applying the style can't leave a stale children rule
    state.set({ ...props, className: getChildrenClassName(props.className), value: childrenValue })
}

export const convertToCSS = (hash: string, value: Record<string, any>, state: CSSState) => {
    Object.entries(value).forEach(([styleKey, styleValue]) => {
        if (styleKey[0] === '_') {
            const isStylePseudoClass = isPseudoClass(styleKey)
            const pseudoClassName = `${hash}${isStylePseudoClass ? ':' : '::'}${styleKey.slice(1)}`

            Object.entries(styleValue).forEach(([pseudoStyleKey, pseudoStyleValue]) => {
                if (typeof pseudoStyleValue === 'object' && pseudoStyleValue !== null) {
                    const allBreakpoints = Object.keys(styleValue)
                    Object.entries(pseudoStyleValue).forEach(([breakpointStyleKey, breakpointStyleValue]) => {
                        const mediaQuery = getMediaQuery(pseudoStyleKey, allBreakpoints)

                        setStyle(state, {
                            mediaQuery,
                            className: pseudoClassName,
                            propertyKey: breakpointStyleKey,
                            value: breakpointStyleValue,
                        })
                    })

                    return
                }

                setStyle(state, {
                    className: pseudoClassName,
                    propertyKey: pseudoStyleKey,
                    value: pseudoStyleValue,
                })
            })

            return
        }

        if (typeof styleValue === 'object') {
            Object.entries(styleValue).forEach(([breakpointStyleKey, breakpointStyleValue]) => {
                const allBreakpoints = Object.entries(value)
                    .filter(([_, value]) => {
                        if (typeof value !== 'object' || value === null) {
                            return false
                        }

                        return breakpointStyleKey in value
                    })
                    .map(([key]) => key)
                const mediaQuery = getMediaQuery(styleKey, allBreakpoints)

                setStyle(state, {
                    mediaQuery,
                    className: hash,
                    propertyKey: breakpointStyleKey,
                    value: breakpointStyleValue,
                })
            })

            return
        }

        setStyle(state, {
            className: hash,
            propertyKey: styleKey,
            value: styleValue,
        })
    })
}
