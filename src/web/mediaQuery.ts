import { UnistylesState } from './state'
import { keyInObject } from './utils'
import { isUnistylesMq, parseMq } from './mq'
import { Orientation } from '../specs/types'

export const getMediaQuery = (query: string) => {
    if (Object.values(Orientation).includes(query as Orientation)) {
        return `(orientation: ${query})`
    }

    if (isUnistylesMq(query)) {
        const { minWidth, maxWidth, minHeight, maxHeight } = parseMq(query)

        return [
            minWidth ? `(min-width: ${minWidth}px)` : undefined,
            maxWidth ? `(max-width: ${maxWidth}px)` : undefined,
            minHeight ? `(min-height: ${minHeight}px)` : undefined,
            maxHeight ? `(max-height: ${maxHeight}px)` : undefined
        ].filter(Boolean).join(' and ')
    }

    const minWidth = UnistylesState.breakpoints && keyInObject(UnistylesState.breakpoints, query) ? UnistylesState.breakpoints[query] : undefined

    return `(min-width: ${minWidth ?? 0}px)`
}
