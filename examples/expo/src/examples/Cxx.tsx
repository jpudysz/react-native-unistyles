import React from 'react'
import { View, Text, Button } from 'react-native'
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles'

export const Cxx: React.FunctionComponent = () => {
    useUnistyles()

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Text
                style={{
                    color: 'orange',
                    fontWeight: 'bold',
                    marginBottom: 20
                }}
            >
                C++ unistyles example
            </Text>
            <Text>
                Current breakpoint: {UnistylesRuntime.getCurrentBreakpoint()}
            </Text>
            <Text>
                Current theme: {UnistylesRuntime.getCurrentTheme()}
            </Text>
            <Button
                title="Change theme"
                onPress={() => {
                    const currentTheme = UnistylesRuntime.getCurrentTheme()
                    const nextTheme = currentTheme === 'light'
                        ? 'dark'
                        : currentTheme === 'dark'
                            ? 'premium'
                            : 'light'
                    UnistylesRuntime.useTheme(nextTheme)
                }}
            />
        </View>
    )
}
