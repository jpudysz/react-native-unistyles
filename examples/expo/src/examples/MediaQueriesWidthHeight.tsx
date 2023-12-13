import React from 'react'
import { Text, View } from 'react-native'
import { mq, createStyleSheet, useStyles, useInitialTheme, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const MediaQueriesWidthHeight: React.FunctionComponent = () => {
    useInitialTheme('light')

    const { styles, theme } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has media queries for width and height
                </Text>
                <Text style={styles.text}>
                    Your window dimensions are: {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
                </Text>
                <Text style={styles.text}>
                    For width up to 500, and height up to 1000 the background is {theme.colors.backgroundColor}
                </Text>
                <Text style={styles.text}>
                    For width above 900 the background is {theme.colors.aloes}
                </Text>
                <Text>
                    Rotate or resize the window to see the changes
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
        backgroundColor: {
            [mq.width(undefined, 500).and.height(undefined, 1000)]: theme.colors.backgroundColor,
            [mq.only.width(932)]: theme.colors.aloes
        },
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: {
            // you can also use media queries with breakpoint keys
            [mq.only.width('xs', 'md')]: theme.colors.typography,
            [mq.only.width('md')]: theme.colors.typography
        }
    }
}))
