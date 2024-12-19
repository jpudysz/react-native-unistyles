import React, { useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { UnistylesWeb } from '../web'

declare global {
    interface Window {
        UNISTYLES_STATE: any
    }
}

export const useServerUnistyles = () => {
    const isServerInserted = useRef(false)

    useServerInsertedHTML(() => {
        if (!isServerInserted.current) {
            isServerInserted.current = true

            const css = UnistylesWeb.registry.css.getStyles()
            const state = UnistylesWeb.registry.css.getState()
            UnistylesWeb.registry.reset()

            return (
                <>
                    <style id='unistyles-web'>{css}</style>
                    <script id='unistyles-script'>{`window.UNISTYLES_STATE = ${JSON.stringify(state)}`}</script>
                </>
            )
        }

        return null
    })

    if (typeof window !== 'undefined') {
        UnistylesWeb.registry.css.hydrate(window.UNISTYLES_STATE)
    }
}
