import React, { createContext } from 'react'
import type { PropsWithChildren } from 'react'

interface UnistylesThemeProps extends PropsWithChildren {
    theme: any
}

export const UnistylesContext = createContext({})

export const UnistylesTheme: React.FunctionComponent<UnistylesThemeProps> = ({
    theme,
    children
}) => (
    <UnistylesContext.Provider value={theme}>
        {children}
    </UnistylesContext.Provider>
)
