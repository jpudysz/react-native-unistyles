import { useEffect, useLayoutEffect, useState } from 'react'
import { isUnistylesMq, isValidMq, parseMq } from '../mq'
import { StyleSheet, UnistyleDependency, UnistylesRuntime } from '../specs'

export const useMedia = (config: { mq: symbol }) => {
    const computeIsVisible = (): boolean => {
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

        const { width, height } = UnistylesRuntime.screen

        if (parsedMq.minWidth !== undefined && width < parsedMq.minWidth) {
            return false
        }

        if (parsedMq.maxWidth !== undefined && width > parsedMq.maxWidth) {
            return false
        }

        if (parsedMq.minHeight !== undefined && height < parsedMq.minHeight) {
            return false
        }

        if (parsedMq.maxHeight !== undefined && height > parsedMq.maxHeight) {
            return false
        }

        return true
    }
    const [isVisible, setIsVisible] = useState<boolean | null>(computeIsVisible())

    useEffect(() => {
        setIsVisible(computeIsVisible())
    }, [config.mq])

    useLayoutEffect(() => {
        // @ts-expect-error - this is hidden from TS
        const removeChangeListener = StyleSheet.addChangeListener((dependencies: Array<UnistyleDependency>) => {
            if (dependencies.includes(UnistyleDependency.Breakpoints)) {
                setIsVisible(computeIsVisible())
            }
        })

        return () => {
            removeChangeListener()
        }
    }, [config.mq])

    return {
        isVisible,
    }
}
