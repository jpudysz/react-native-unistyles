'use client'

import { useServerInsertedHTML } from 'next/navigation'
import { type PropsWithChildren, useRef } from 'react'
import { useServerUnistyles } from 'react-native-unistyles/server'

import './unistyles'

export const Style = ({ children }: PropsWithChildren) => {
    const isServerInserted = useRef(false)
    const unistyles = useServerUnistyles()

    useServerInsertedHTML(() => {
        if (isServerInserted.current) {
            return null
        }

        isServerInserted.current = true

        return unistyles
    })

    return <>{children}</>
}
