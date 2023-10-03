import React from 'react'
import { UnistylesTheme } from 'react-native-unistyles'
import { ExampleScreen } from './ExampleScreen'
import { theme } from './styles'

export const App: React.FunctionComponent = () => (
    <UnistylesTheme theme={theme}>
        <ExampleScreen />
    </UnistylesTheme>
)
