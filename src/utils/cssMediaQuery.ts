import { normalizeColor } from '../normalizer'
import { isUnistylesMq, isValidMq, parseMq, type UnistylesParsedMq } from './mqParser'
import type { RNStyle, RNValue } from '../types'
import { generateReactNativeWebId } from './generateId'
import type { UnistylesRuntime } from '../core'

export const createMediaQueryForStyles = (styles: RNStyle, runtime: UnistylesRuntime): RNStyle => {
    const withMediaQueries = Object
        .entries(styles)
        .filter(([, value]) => typeof value === 'object')
        .reduce((acc, [prop, value]) => {
            const objectKeys = Object.keys(value)
            const mediaQueries = objectKeys.filter(key => isUnistylesMq(key))
            const breakpoints = objectKeys.filter(key => runtime.breakpoints[key as keyof typeof runtime.breakpoints])

            if (mediaQueries.length === 0 && breakpoints.length === 0) {
                return acc
            }

            const className = generateReactNativeWebId(prop, '""')
            const breakpointsStyles = getBreakpointsStyles(prop, value as Record<string, RNValue>, runtime, className)
            const mediaQueriesStyles = getMediaQueriesFromMQ(prop, value as Record<string, RNValue>, className)

            return {
                ...acc,
                [prop]: `
                    ${breakpointsStyles} 
                    ${mediaQueriesStyles}
                `.trim()
            }
        }, {})

    return {
        ...styles,
        ...withMediaQueries
    }
}

const getMaxWidthMediaQuery = (width: UnistylesParsedMq['width']): string => {
    if (!width) {
        return ''
    }

    if (width.to === Infinity) {
        return ''
    }

    return `and (max-width: ${width.to}px)`
}

const getMaxHeightMediaQuery = (height: UnistylesParsedMq['height']): string => {
    if (!height) {
        return ''
    }

    if (height.to === Infinity) {
        return ''
    }

    return `and (max-height: ${height.to}px)`
}

const getMediaQueriesFromMQ = (prop: string, value: Record<string, RNValue>, className: string): string => Object
    .entries(value)
    .reduce((acc, [key, value]) => {
        const result = parseMq(key)

        if (!isValidMq(result)) {
            return acc
        }

        if (result.width && result.height) {
            return `${acc}

                @media screen and (min-width: ${result.width.from}px) and (min-height: ${result.height.from}px) ${getMaxWidthMediaQuery(result.width)} ${getMaxHeightMediaQuery(result.height)} {
                    .${className} {
                        ${normalizePropName(prop)}: ${normalizeWebValue(prop, value)};
                    }
                }
            `
        }

        if (result.width) {
            return `${acc}

                @media screen and (min-width: ${result.width.from}px) ${getMaxWidthMediaQuery(result.width)} {
                    .${className} {
                        ${normalizePropName(prop)}: ${normalizeWebValue(prop, value)};
                    }
                }
            `
        }

        if (result.height) {
            return `${acc}

                @media screen and (min-height: ${result.height.from}px) ${getMaxHeightMediaQuery(result.height)} {
                    .${className} {
                        ${normalizePropName(prop)}: ${normalizeWebValue(prop, value)};
                    }
                }
            `
        }

        return acc
    }, '')

const getBreakpointsStyles = (prop: string, value: Record<string, RNValue>, runtime: UnistylesRuntime, className: string): string => Object
    .entries(value)
    .reduce((acc, [key, value]) => {
        const breakpoint = runtime.breakpoints[key as keyof typeof runtime.breakpoints]

        if (breakpoint === undefined) {
            return acc
        }

        return `${acc}

            @media screen and (min-width: ${breakpoint}px) {
                .${className} {
                    ${normalizePropName(prop)}: ${normalizeWebValue(prop, value)};
                }
            }
        `
    }, '')

const normalizePropName = (prop: string) => prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

const normalizeWebValue = (prop: string, value: RNValue): string => {
    if (value === undefined) {
        return 'unset'
    }

    switch (prop) {
        // colors
        case 'color':
        case 'backgroundColor':
        case 'borderColor':
        case 'borderBottomColor':
        case 'borderLeftColor':
        case 'borderRightColor':
        case 'borderTopColor':
        case 'borderBlockColor':
        case 'borderBlockEndColor':
        case 'borderBlockStartColor':
        case 'textDecorationColor':
            return normalizeColor(value as string)

        // dimensions
        case 'width':
        case 'height':
        case 'minWidth':
        case 'minHeight':
        case 'maxWidth':
        case 'maxHeight':
        case 'borderRadius':
        case 'borderWidth':
        case 'borderBottomLeftRadius':
        case 'borderBottomRightRadius':
        case 'borderEndEndRadius':
        case 'borderEndStartRadius':
        case 'borderStartEndRadius':
        case 'borderStartStartRadius':
        case 'borderTopLeftRadius':
        case 'borderTopRightRadius':
        case 'borderBottomWidth':
        case 'borderLeftWidth':
        case 'borderRightWidth':
        case 'borderTopWidth':
        case 'bottom':
        case 'left':
        case 'right':
        case 'top':
        case 'marginTop':
        case 'marginBottom':
        case 'marginLeft':
        case 'marginRight':
        case 'paddingTop':
        case 'paddingBottom':
        case 'paddingLeft':
        case 'paddingRight':
        case 'flexBasis':
        case 'rowGap':
        case 'columnGap':
        case 'gap':
        case 'margin':
        case 'padding':
        case 'fontSize':
        case 'letterSpacing':
            return `${value as string}px`

        // without unit
        case 'borderStyle':
        case 'pointerEvents':
        case 'backfaceVisibility':
        case 'alignContent':
        case 'alignItems':
        case 'alignSelf':
        case 'flexDirection':
        case 'flexWrap':
        case 'flex':
        case 'aspectRatio':
        case 'opacity':
        case 'direction':
        case 'zIndex':
        case 'justifyContent':
        case 'overflow':
        case 'display':
        case 'position':
        case 'flexGrow':
        case 'flexShrink':
        case 'fontFamily':
        case 'fontStyle':
        case 'textDecorationLine':
        case 'textAlign':
        case 'textDecorationStyle':
        case 'lineHeight':
        case 'textTransform':
        case 'fontVariant':
        case 'verticalAlign':
        case 'objectFit':
            return value as string

        // to be transformed for now
        // not supported
        case 'marginHorizontal':
        case 'paddingHorizontal':
        case 'marginVertical':
        case 'paddingVertical':
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
        case 'transform':
        case 'transformMatrix':
        case 'fontWeight':
        case 'textShadowOffset':
        case 'textShadowRadius':
        case 'textShadowColor':
            return ''

        // unsupported
        case 'borderStartColor':
        case 'borderEndColor':
        case 'borderEndWidth':
        case 'borderBottomEndRadius':
        case 'borderBottomStartRadius':
        case 'borderCurve':
        case 'elevation':
        case 'borderTopEndRadius':
        case 'borderTopStartRadius':
        case 'borderStartWidth':
        case 'start':
        case 'end':
        case 'margin-end':
        case 'margin-start':
        case 'padding-end':
        case 'padding-start':
        case 'writingDirection':
        case 'textAlignVertical':
        case 'includeFontPadding':
        case 'resizeMode':
        case 'overlayColor':
        case 'tintColor':
        default:
            return ''
    }
}
