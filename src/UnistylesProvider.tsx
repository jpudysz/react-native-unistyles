import React from 'react'
import type { UnistylesBreakpoints } from './global'
import type { ScreenDimensions, ScreenInsets, ScreenSize, UnistylesTheme } from './types'
import { useSharedContext } from './hooks/useSharedContext'

export type TUnistylesContext = {
    plugins: Array<string>,
    theme: UnistylesTheme,
    layout: {
        screen: ScreenSize,
        statusBar: ScreenDimensions,
        navigationBar: ScreenDimensions,
        insets: ScreenInsets,
        breakpoint: keyof UnistylesBreakpoints
        orientation: 'landscape' | 'portrait'
    }
}

export const UnistylesContext = React.createContext<TUnistylesContext | undefined>(undefined)

export const UnistylesProvider = ({ children }: { children: React.ReactNode }) => {
    const { plugins, theme, layout } = useSharedContext({
        // intentionally false, we want to listen for changes in the provider
        useContext: false,
        deps: []
    })

    return (
        <UnistylesContext.Provider value={{ theme, layout, plugins }}>
            {children}
        </UnistylesContext.Provider>
    )
}
