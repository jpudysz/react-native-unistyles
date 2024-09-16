import type { MediaQuery } from 'typestyle/lib/types'
import { UnistylesState } from '../state'
import { keyInObject } from '../utils'
import { isUnistylesMq, parseMq } from '../mq'

export const convertBreakpoint = (breakpoint: string): MediaQuery => {
    if (isUnistylesMq(breakpoint)) {
        return parseMq(breakpoint)
    }

    return {
        minWidth: UnistylesState.breakpoints && keyInObject(UnistylesState.breakpoints, breakpoint) ? UnistylesState.breakpoints[breakpoint] : undefined,
    }
}
