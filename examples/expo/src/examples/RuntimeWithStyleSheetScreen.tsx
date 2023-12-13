import React from 'react'
import { View, Text } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const RuntimeWithStyleSheetScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    You can also use runtime in your StyleSheets.
                </Text>
                <Text style={styles.text}>
                    In this demo box changes dimensions based on screen width and height.
                </Text>
                <View style={styles.box}>
                    <Text>
                        I'm half width and height of the screen.
                    </Text>
                </View>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 16,
        color: theme.colors.typography
    },
    box: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
        width: UnistylesRuntime.screen.width / 2,
        height: UnistylesRuntime.screen.height / 2,
        backgroundColor: UnistylesRuntime.orientation === 'portrait'
            ? theme.colors.accent
            : theme.colors.oak
    }
}))
