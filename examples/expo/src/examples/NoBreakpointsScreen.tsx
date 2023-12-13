import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, useInitialTheme } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const NoBreakpointsScreen: React.FunctionComponent = () => {
    useInitialTheme('light')

    const { styles, breakpoint } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has no registered breakpoints and behaves as usual.
                </Text>
                <Text style={styles.text}>
                    The current breakpoint is: {breakpoint === undefined ? 'undefined' : breakpoint}
                </Text>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor,
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    }
}))
