import { keyInObject } from '../utils'

const SKIP_STYLES = [
    'borderCurve',
    'elevation',
    'textAlignVertical',
    'includeFontPadding',
    'overlayColor',
    'tintColor'
]

const CSS_NUMBER_KEYS = [
    'animationIterationCount',
    'borderImageOutset',
    'borderImageSlice',
    'borderImageWidth',
    'boxFlex',
    'boxFlexGroup',
    'boxOrdinalGroup',
    'columnCount',
    'columns',
    'counterIncrement',
    'counterReset',
    'flex',
    'flexGrow',
    'flexPositive',
    'flexShrink',
    'flexNegative',
    'flexOrder',
    'fontWeight',
    'gridArea',
    'gridColumn',
    'gridColumnEnd',
    'gridColumnSpan',
    'gridColumnStart',
    'gridRow',
    'gridRowEnd',
    'gridRowSpan',
    'gridRowStart',
    'line-clamp',
    'line-height',
    'opacity',
    'order',
    'orphans',
    'tabSize',
    'widows',
    'zIndex',
    'zoom',
    'fillOpacity',
    'floodOpacity',
    'stopOpacity',
    'strokeDasharray',
    'strokeDashoffset',
    'strokeMiterlimit',
    'strokeOpacity',
    'strokeWidth'
]

const convertMap = {
    marginHorizontal: (value: number) => ({
        marginInline: value
    }),
    marginVertical: (value: number) => ({
        marginBlock: value
    }),
    paddingHorizontal: (value: number) => ({
        paddingInline: value
    }),
    paddingVertical: (value: number) => ({
        paddingBlock: value
    }),
    writingDirection: (value: string) => ({
        direction: value
    }),
    borderBottomEndRadius: (value: number) => ({
        borderBottomRightRadius: value
    }),
    borderBottomStartRadius: (value: number) => ({
        borderBottomLeftRadius: value
    }),
    borderEndColor: (value: string) => ({
        borderInlineEndColor: value
    }),
    borderStartColor: (value: string) => ({
        borderInlineStartColor: value
    }),
    borderTopEndRadius: (value: number) => ({
        borderTopRightRadius: value
    }),
    borderTopStartRadius: (value: number) => ({
        borderTopLeftRadius: value
    }),
    borderEndWidth: (value: number) => ({
        borderInlineEndWidth: value
    }),
    borderStartWidth: (value: number) => ({
        borderInlineStartWidth: value
    }),
    end: (value: number) => ({
        right: value
    }),
    start: (value: number) => ({
        left: value
    }),
    marginEnd: (value: number) => ({
        marginRight: value
    }),
    marginStart: (value: number) => ({
        marginLeft: value
    }),
    paddingEnd: (value: number) => ({
        paddingRight: value
    }),
    paddingStart: (value: number) => ({
        paddingLeft: value
    }),
    transformMatrix: (value: Array<number>) => ({
        transform: `matrix(${value.join(', ')})`
    }),
    resizeMode: (value: string) => ({
        backgroundSize: value
    })
} as Record<PropertyKey, (value: any) => Record<string, any>>

const convertNumber = (key: string, value: any) => {
    if (typeof value === 'number') {
        return CSS_NUMBER_KEYS.includes(key, value) ? value : `${value}px`
    }

    return value
}

export const getStyle = (key: string, value: any) => {
    if (SKIP_STYLES.includes(key)) {
        return {}
    }

    if (keyInObject(convertMap, key)) {
        return convertMap[key]?.(convertNumber(key, value)) ?? {}
    }

    return {
        [key]: convertNumber(key, value)
    }
}
