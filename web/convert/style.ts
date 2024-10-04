import { keyInObject } from '../utils'
import type { NestedCSSProperties } from 'typestyle/lib/types'

const stylesToSkip = [
    'borderCurve',
    'elevation',
    'textAlignVertical',
    'includeFontPadding',
    'overlayColor',
    'tintColor'
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
    }),
    lineHeight: (value: number) => ({
        lineHeight: `${value}px`
    }),
} as Record<PropertyKey, (value: any) => NestedCSSProperties>

export const getStyle = (key: string, value: any) => {
    if (stylesToSkip.includes(key)) {
        return {}
    }

    if (keyInObject(convertMap, key)) {
        return convertMap[key]?.(value) ?? {}
    }

    return {
        [key]: value
    }
}
