import React, { useRef } from 'react'
import { StyleSheet } from 'react-native'
import { UnistylesWeb } from '../web'
import { isServer } from '../web/utils'

declare global {
    interface Window {
        // @ts-ignore
        __UNISTYLES_STATE__: ReturnType<typeof UnistylesWeb.registry.css.getState>
    }
}

export const getServerUnistyles = (includeRNWStyles = true) => {
    if (!isServer()) throw new Error('Server styles should only be read on the server')
    // @ts-ignore
    const rnwStyle: string | null = includeRNWStyles ? (StyleSheet?.getSheet().textContent ?? '') : null
    const css = UnistylesWeb.registry.css.getStyles()
    const state = UnistylesWeb.registry.css.getState()
    return <>
        {rnwStyle && <style id='rnw-style'>{rnwStyle}</style>}
        <style id='unistyles-web'>{css}</style>
        <script id='unistyles-script'>{`window.__UNISTYLES_STATE__ = ${JSON.stringify(state)}`}</script>
    </>
}

export const resetServerUnistyles = () => {
    if (!isServer()) throw new Error('Server styles should only be reset on the server')
    UnistylesWeb.registry.reset()
}

export const hydrateServerUnistyles = () => {
    if (isServer()) throw new Error('Server styles should only be hydrated on the client')
    UnistylesWeb.registry.css.hydrate(window.__UNISTYLES_STATE__)
    document.querySelector('#unistyles-script')?.remove()
}

export const useServerUnistyles = (includeRNWStyles = true): React.ReactNode | null => {
    const isServerInserted = useRef(false)

    if (isServer() && !isServerInserted.current) {
        isServerInserted.current = true
        const components = getServerUnistyles(includeRNWStyles)
        resetServerUnistyles()
        return components
    }

    if (!isServer()) {
        hydrateServerUnistyles()
    }
    return null
}
