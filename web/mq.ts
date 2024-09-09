import type { MediaQuery } from 'typestyle/lib/types'

const IS_UNISTYLES_REGEX = /:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_WIDTH_REGEX = /:(w)\[(\d+)(?:,\s*(\d+|Infinity))?]/
const UNISTYLES_HEIGHT_REGEX = /:(h)\[(\d+)(?:,\s*(\d+|Infinity))?]/

export const parseMq = (mq: string): MediaQuery => {
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
