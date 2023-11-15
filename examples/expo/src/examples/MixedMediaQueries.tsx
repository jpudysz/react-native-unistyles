import React from 'react'
import { Text, View } from 'react-native'
import { mq, createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const MixedMediaQueries: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This demo has media queries for width and height and user defined breakpoints
                </Text>
                <Text style={styles.text}>
                    Media queries have bigger priority than user defined breakpoints!
                </Text>
                <Text style={styles.text}>
                    Your window dimensions are: {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
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
            [mq.w(null, 430).h(null, 1000)]: theme.colors.barbie,
            // xs will could also be applied here, but it has lower priority than media queries
            xs: theme.colors.aloes
        },
        rowGap: 20
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    }
}))
