import React from 'react'
import { StyleSheet } from 'react-native'

import * as unistyles from '../web/services'
import { UNISTYLES_PRECEDENCE, UNISTYLES_RESOURCE_ANCHOR_ID } from '../web/styleResource'
import { error, isServer } from '../web/utils'
import { serialize } from './serialize'
import { DefaultServerUnistylesSettings, type ServerUnistylesSettings } from './types'

export const getServerUnistyles = ({
    includeRNWStyles = true,
    layerRNWStyles = false,
}: ServerUnistylesSettings = DefaultServerUnistylesSettings) => {
    if (!isServer()) {
        throw error('Server styles should only be read on the server')
    }

    // @ts-ignore
    const rnwStyle: string | null = includeRNWStyles ? (StyleSheet?.getSheet().textContent ?? '') : null
    const css = unistyles.services.registry.css.getStyles()
    const state = unistyles.services.registry.css.getState()
    // React can hoist host-local resources ahead of useServerInsertedHTML.
    // RSC adapters can opt the late RNW snapshot into a lower cascade layer
    // without changing the legacy SSR cascade for existing consumers.
    const serializedRNWStyle = rnwStyle && layerRNWStyles ? `@layer react-native-unistyles-rnw{${rnwStyle}}` : rnwStyle

    return (
        <>
            {serializedRNWStyle && <style id="rnw-style">{serializedRNWStyle}</style>}
            <style data-precedence={UNISTYLES_PRECEDENCE} id={UNISTYLES_RESOURCE_ANCHOR_ID} />
            <style id="unistyles-web">{css}</style>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Needs the json quotes to be unescaped */}
            <script
                id="unistyles-script"
                defer
                dangerouslySetInnerHTML={{ __html: `window.__UNISTYLES_STATE__ = ${serialize(state)}` }}
            />
        </>
    )
}
