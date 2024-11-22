import type { Nullable } from './types'
import type { UnistylesBreakpoints } from './global'
import { UnistylesRuntime } from './specs'

const IS_UNISTYLES_REGEX = /:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_WIDTH_REGEX = /:(w)\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_HEIGHT_REGEX = /:(h)\[(\d+)(?:,\s*(\d+|Infinity))?]/

type MQValue = keyof UnistylesBreakpoints | number

type MQHandler = {
    only: {
        width(wMin?: Nullable<MQValue>, wMax?: MQValue): symbol,
        height(hMin?: Nullable<MQValue>, hMax?: MQValue): symbol,
    },
    width(wMin?: Nullable<MQValue>, wMax?: MQValue): {
        and: {
            height(hMin?: Nullable<MQValue>, hMax?: MQValue): symbol
        }
    },
    height(hMin?: Nullable<MQValue>, hMax?: MQValue): {
        and: {
            width(wMin?: Nullable<MQValue>, wMax?: MQValue): symbol
        }
    }
}

const getMQValue = (value: Nullable<MQValue>) => {
    if (typeof value === 'number') {
        return value
    }

    if (value === null) {
        return 0
    }

    const breakpoints = UnistylesRuntime.breakpoints

    return breakpoints[value] ?? 0
}

/**
 * Utility to create cross-platform media queries
 * @returns - JavaScript symbol to be used in your stylesheet
 */
export const mq: MQHandler = {
    only: {
        width: (wMin: Nullable<MQValue> = 0, wMax: MQValue = Number.POSITIVE_INFINITY) => (`:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]` as unknown as symbol),
        height: (hMin: Nullable<MQValue> = 0, hMax: MQValue = Number.POSITIVE_INFINITY) => (`:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]` as unknown as symbol)
    },
    width: (wMin: Nullable<MQValue> = 0, wMax: MQValue = Number.POSITIVE_INFINITY) => ({
        and: {
            height: (hMin: Nullable<MQValue> = 0, hMax: MQValue = Number.POSITIVE_INFINITY) =>
                (`:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]` as unknown as symbol)
        }
    }),
    height: (hMin: Nullable<MQValue> = 0, hMax: MQValue = Number.POSITIVE_INFINITY) => ({
        and: {
            width: (wMin: Nullable<MQValue> = 0, wMax: MQValue = Number.POSITIVE_INFINITY) =>
                (`:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]` as unknown as symbol)
        }
    })
}

export const parseMq = (mq: string) => {
    const [, width, fromW, toW] = UNISTYLES_WIDTH_REGEX.exec(mq) || []
    const [, height, fromH, toH] = UNISTYLES_HEIGHT_REGEX.exec(mq) || []

    return {
        minWidth: !width || fromW === 'Infinity' ? undefined : Number(fromW),
        maxWidth: !width || toW === 'Infinity' ? undefined : Number(toW),
        minHeight: !height || fromH === 'Infinity' ? undefined : Number(fromH),
        maxHeight: !height || toH === 'Infinity' ? undefined : Number(toH),
    }
}

export const isUnistylesMq = (mq: string) => IS_UNISTYLES_REGEX.test(mq)

export const isValidMq = (parsedMQ: ReturnType<typeof parseMq>) => {
    const isWidthValid = parsedMQ.minWidth === undefined || parsedMQ.maxWidth === undefined || parsedMQ.minWidth <= parsedMQ.maxWidth
    const isHeightValid = parsedMQ.minHeight === undefined || parsedMQ.maxHeight === undefined || parsedMQ.minHeight <= parsedMQ.maxHeight

    return isWidthValid && isHeightValid
}
