import React from 'react'
import { useInitialTheme, UnistylesRegistry, UnistylesColorScheme } from 'react-native-unistyles'
import { Cxx } from './examples'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from './styles'

UnistylesRegistry
    .addThemes({
        light: lightTheme,
        dark: darkTheme,
        premium: premiumTheme
    })
    .addBreakpoints(breakpoints)
    .addConfig({
        colorScheme: UnistylesColorScheme.System
    })

export const App: React.FunctionComponent = () => {
    useInitialTheme('premium')

    return (
        <Cxx />
    )
}
