import { useEffect, useRef, useState } from 'react'
import { isUnistylesMq, isValidMq, parseMq } from '../utils'

export const useMedia = (config: { mq: symbol }) => {
    const disposeRef = useRef(() => {})
    const [isVisible, setIsVisible] = useState(() => {
        const maybeMq = config.mq as unknown as string

        if (!isUnistylesMq(maybeMq)) {
            console.error(`🦄 Unistyles: Received invalid mq: ${maybeMq}`)

            return false
        }

        const parsedMq = parseMq(maybeMq)

        if (!isValidMq(parsedMq)) {
            console.error(`🦄 Unistyles: Received invalid mq where min is greater than max: ${maybeMq}`)

            return false
        }

        const { minWidth, maxWidth, minHeight, maxHeight } = parsedMq

        const mediaQuery = [
            minWidth !== undefined ? `(min-width: ${minWidth}px)` : undefined,
            maxWidth !== undefined ? `(max-width: ${maxWidth}px)` : undefined,
            minHeight !== undefined ? `(min-height: ${minHeight}px)` : undefined,
            maxHeight !== undefined ? `(max-height: ${maxHeight}px)` : undefined
        ].filter(Boolean).join(' and ')

        const media = window.matchMedia(mediaQuery)
        const handler = (event: MediaQueryListEvent) => setIsVisible(event.matches)

        media.addEventListener('change', handler)
        disposeRef.current = () => media.removeEventListener('change', handler)

        return media.matches
    })

    // Unmount
    useEffect(() => () => disposeRef.current(), [])

    return {
        isVisible
    }
}
