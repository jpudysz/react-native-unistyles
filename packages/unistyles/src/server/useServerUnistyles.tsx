import React, { useRef } from 'react'

import { isServer } from '../web/utils'
import { getServerUnistyles } from './getServerUnistyles'
import { hydrateServerUnistyles } from './hydrateServerUnistyles'
import { resetServerUnistyles } from './resetServerUnistyles'
import { DefaultServerUnistylesSettings, type ServerUnistylesSettings } from './types'

export const useServerUnistyles = (
    settings: ServerUnistylesSettings = DefaultServerUnistylesSettings,
): React.ReactNode | null => {
    const isServerInserted = useRef(false)

    if (isServer() && !isServerInserted.current) {
        isServerInserted.current = true
        const components = getServerUnistyles(settings)
        resetServerUnistyles()
        return components
    }

    if (!isServer()) {
        hydrateServerUnistyles()
    }
    return null
}
