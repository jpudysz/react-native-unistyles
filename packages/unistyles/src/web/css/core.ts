import type { CSSState } from './state'

import { isPseudoClass } from '../convert/pseudo'
import { getMediaQuery } from '../utils'

type SetStyleProps = Parameters<CSSState['set']>[0]

// `box-none` and `box-only` are not CSS values, so the browser drops them. Emit the same rules
// react-native-web's StyleSheet compiler does: the element gets `none`/`auto` (!important, so it
// wins over an ancestor's descendant rule) and its descendants/children get the opposite value.
export const getPointerEventsChildClassNames = (className: string) => ({
    boxNone: `${className} *`,
    boxOnly: `${className}>*`,
})

const setStyle = (state: CSSState, props: SetStyleProps) => {
    if (props.propertyKey !== 'pointerEvents') {
        state.set(props)

        return
    }

    const childClassNames = getPointerEventsChildClassNames(props.className)

    // the same hash can be re-applied with a new value (e.g. a theme or breakpoint dependency),
    // so drop child rules generated for the previous value
    state.unset({ ...props, className: childClassNames.boxNone })
    state.unset({ ...props, className: childClassNames.boxOnly })

    switch (props.value) {
        case 'box-none':
            state.set({ ...props, value: 'none!important' })
            state.set({ ...props, className: childClassNames.boxNone, value: 'auto' })

            return
        case 'box-only':
            state.set({ ...props, value: 'auto!important' })
            state.set({ ...props, className: childClassNames.boxOnly, value: 'none' })

            return
        case 'auto':
        case 'none':
            state.set({ ...props, value: `${props.value}!important` })

            return
        default:
            state.set(props)
    }
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
