import React, { createContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { isServer } from './utils'

interface UnistylesThemeProps extends PropsWithChildren {
    theme: any
}

export const UnistylesContext = createContext({})

export const UnistylesTheme: React.FunctionComponent<UnistylesThemeProps> = ({
    theme,
    children
}) => {
    const [isClient, setIsClient] = useState(!isServer)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return (
        <UnistylesContext.Provider value={theme}>
            {isClient ? children : <React.Fragment /> }
        </UnistylesContext.Provider>
    )
}
