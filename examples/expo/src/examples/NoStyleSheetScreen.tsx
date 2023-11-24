import React from 'react'
import { View, Text } from 'react-native'
import { useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const NoStyleSheetScreen: React.FunctionComponent = () => {
    const { theme, breakpoint } = useStyles()

    return (
        <DemoScreen>
            <View
                style={{
                    backgroundColor: 'white',
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    rowGap: 20
                }}
            >
                <Text>
                    You can use useStyles without a stylesheet.
                </Text>
                <Text>
                    It will help you access current breakpoint and theme.
                </Text>
                <Text>
                    theme = {JSON.stringify(theme, null, 2)}
                </Text>
                <Text>
                    Breakpoint: {breakpoint}
                </Text>
            </View>
        </DemoScreen>
    )
}

