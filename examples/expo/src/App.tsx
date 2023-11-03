import React from 'react'
import { useInitialTheme, UnistylesRegistry } from 'react-native-unistyles'
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
        adaptiveThemes: true
    })

export const App: React.FunctionComponent = () => {
    useInitialTheme('premium')

    return (
        <Cxx />
    )
}
