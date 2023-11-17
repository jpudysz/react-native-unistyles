import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const AutoGuidelinePluginScreen: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a Auto Guideline plugin enable
                </Text>
                <Text style={styles.text}>
                    It will scale your text and sizes based on the screen size
                </Text>
                <Text style={styles.text}>
                    Box won't scale because plugin skips styles with `unscaled` prefix
                </Text>
                <View style={styles.unscaledBox} />
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 10,
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        fontSize: 12,
        textAlign: 'center',
        color: theme.colors.typography
    },
    unscaledBox: {
        width: 100,
        height: 100,
        backgroundColor: theme.colors.blood
    }
}))
