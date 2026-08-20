'use client'

import type { PropsWithChildren } from 'react'
import { useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { useServerUnistyles } from 'react-native-unistyles/server'

import './unistyles'

export const Style = ({ children }: PropsWithChildren) => {
    const isServerInserted = useRef(false)
    const unistyles = useServerUnistyles({
        includeRNWStyles: true,
        layerRNWStyles: true,
    })

    useServerInsertedHTML(() => {
        if (isServerInserted.current) {
            return null
        }

        isServerInserted.current = true

        return unistyles
    })

    return <>{children}</>
}
