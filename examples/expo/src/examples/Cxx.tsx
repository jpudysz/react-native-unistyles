import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'
import { breakpoints, darkTheme, lightTheme, premiumTheme } from '../styles'

UnistylesRuntime
    .registerBreakpoints(breakpoints)
    .registerTheme('light', lightTheme)
    .registerTheme('dark', darkTheme)
    .registerTheme('premium', premiumTheme)

export const Cxx: React.FunctionComponent = () => {
    useEffect(() => {
        console.log(UnistylesRuntime.getCurrentBreakpoint())
    }, [])

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Text>
                Cxx Styles example
            </Text>
        </View>
    )
}
