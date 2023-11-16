import type { NestedStylePairs, Optional, ScreenSize } from '../types'

const IS_UNISTYLES_REGEX = /:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_WIDTH_REGEX = /:(w)\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_HEIGHT_REGEX = /:(h)\[(\d+)(?:,\s*(\d+|Infinity))?]/

type ParsedMqDimension = {
    from: number,
    to: number
}

type UnistylesParsedMq = {
    width?: ParsedMqDimension,
    height?: ParsedMqDimension
}

const parseMq = (mq: string): UnistylesParsedMq => {
    const [, width, fromW, toW] = UNISTYLES_WIDTH_REGEX.exec(mq) || []
    const [, height, fromH, toH] = UNISTYLES_HEIGHT_REGEX.exec(mq) || []

    return {
        width: width ? {
            from: Number(fromW),
            to: Number(toW)
        } : undefined,
        height: height ? {
            from: Number(fromH),
            to: Number(toH)
        } : undefined
    }
}

const isUnistylesMq = (mq: string) => IS_UNISTYLES_REGEX.test(mq)

const isValidMq = (parsedMq: UnistylesParsedMq) => {
    const { width, height } = parsedMq

    if (width && height) {
        return width.from <= width.to && height.from <= height.to
    }

    if (width) {
        return width.from <= width.to
    }

    if (height) {
        return height.from <= height.to
    }

    return false
}

const isWithinTheWidthAndHeight = (parsedMq: UnistylesParsedMq, screenSize: ScreenSize): boolean => {
    const { width, height } = parsedMq

    if (width && height) {
        return isWithinTheWidth(width, screenSize.width) && isWithinTheHeight(height, screenSize.height)
    }

    if (width) {
        return isWithinTheWidth(width, screenSize.width)
    }

    if (height) {
        return isWithinTheHeight(height, screenSize.height)
    }

    return false
}

const isWithinTheWidth = (width: UnistylesParsedMq['width'], screenWidth: number): boolean => {
    const { from, to } = width as ParsedMqDimension

    return screenWidth >= from && screenWidth <= to
}

const isWithinTheHeight = (height: UnistylesParsedMq['height'], screenHeight: number): boolean => {
    const { from, to } = height as ParsedMqDimension

    return screenHeight >= from && screenHeight <= to
}

export const getKeyForUnistylesMediaQuery = (mediaQueries: NestedStylePairs, screenSize: ScreenSize) => {
    const mq = mediaQueries.find(([key]) => {
        if (!isUnistylesMq(key as string)) {
            return false
        }

        const parsedMq = parseMq(key as string)

        if (!isValidMq(parsedMq)) {
            return false
        }

        return isWithinTheWidthAndHeight(parsedMq, screenSize)
    })

    return mq?.at(0) as Optional<string>
}
