import React from 'react'
import { UnistylesTheme } from 'react-native-unistyles'
import * as Examples from './examples'
import { theme } from './styles'

export const App: React.FunctionComponent = () => (
    <UnistylesTheme theme={theme}>
        <Examples.Extreme />
    </UnistylesTheme>
)
