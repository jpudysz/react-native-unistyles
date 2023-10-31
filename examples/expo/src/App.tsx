import React from 'react'
import { UnistylesRuntime, useInitialTheme } from 'react-native-unistyles'
import { Cxx } from './examples'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from './styles'

UnistylesRuntime
    .registerBreakpoints(breakpoints)
    .registerTheme('light', lightTheme)
    .registerTheme('dark', darkTheme)
    .registerTheme('premium', premiumTheme)
    .useTheme('light')

export const App: React.FunctionComponent = () => {
    useInitialTheme('light')

    return (
        <Cxx />
    )
}
