import React, { useMemo } from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRegistry, type UnistylesThemes } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { lightTheme } from '../styles'

export const SingleThemeScreen: React.FunctionComponent = () => {
    useMemo(() => {
        // You shouldn't useMemo in your app, it's just for the demo
        // as we're having tons of screens with different setups
        // simply move it above the component, so you will hit reigstry only once
        UnistylesRegistry
            .addThemes({
                light: lightTheme
                // we need to cast it to UnistylesThemes as we already registered 3 themes under styles/index.ts,
                // but we want to demonstrate how to register a single theme
            } as UnistylesThemes)
    }, [])

    // you can access your theme here
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
