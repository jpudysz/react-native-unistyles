import React, { useState } from 'react'
import { UnistylesTheme } from 'react-native-unistyles'
import * as Examples from './examples'
import { darkTheme, lightTheme } from './styles'

enum Theme {
    Light = 'light',
    Dark = 'dark'
}

export const App: React.FunctionComponent = () => {
    const [theme, setTheme] = useState<Theme>(Theme.Light)
    const appTheme = theme === Theme.Light
        ? lightTheme
        : darkTheme

    return (
        <UnistylesTheme theme={appTheme}>
            <Examples.Memoization />
        </UnistylesTheme>
    )
}
