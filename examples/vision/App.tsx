import React from 'react'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { View, Text } from 'react-native'
import './styles'

export const App: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    text: {
        fontSize: 132,
        color: theme.colors.typography
    }
}))
