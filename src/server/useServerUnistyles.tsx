import React, { useRef } from 'react'
import { StyleSheet } from 'react-native'
import { useServerInsertedHTML } from 'next/navigation'
import { UnistylesWeb } from '../web'

declare global {
    interface Window {
        // @ts-ignore
        __UNISTYLES_STATE__: ReturnType<typeof UnistylesWeb.registry.css.getState>
    }
}

export const useServerUnistyles = () => {
    const isServerInserted = useRef(false)

    useServerInsertedHTML(() => {
        if (!isServerInserted.current) {
            isServerInserted.current = true

            // @ts-ignore
            const rnwStyle = StyleSheet?.getSheet().textContent ?? ''
            const css = UnistylesWeb.registry.css.getStyles()
            const state = UnistylesWeb.registry.css.getState()
            UnistylesWeb.registry.reset()

            return (
                <>
                    <style id='rnw-style'>{rnwStyle}</style>
                    <style id='unistyles-web'>{css}</style>
                    <script id='unistyles-script'>{`window.__UNISTYLES_STATE__ = ${JSON.stringify(state)}`}</script>
                </>
            )
        }

        return null
    })

    if (typeof window !== 'undefined') {
        UnistylesWeb.registry.css.hydrate(window.__UNISTYLES_STATE__)
        document.querySelector('#unistyles-script')?.remove()
    }
}
