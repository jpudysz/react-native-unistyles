import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const SingleThemeScreen: React.FunctionComponent = () => {
    // you can access your theme here
    // if you have one theme it will be auto-selected by Unistyles
    const { styles, theme } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a single theme (light), registered with the `UnistylesRegistry.addThemes` function.
                </Text>
                <Text style={styles.text}>
                    The current background is: {theme.colors.backgroundColor}
                </Text>
            </View>
        </DemoScreen>
    )
}

const stylesheet = createStyleSheet(theme => ({
    // you can access your theme here
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
