import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const LightDarkThemesScreen: React.FunctionComponent = () => {
    // if you have 2 or more themes, you need to select one of them
    // unless, you have light and dark themes, and you enable adaptiveMode, then unistyles will select theme based on user's device settings
    const { styles  } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has two themes registered with `UnistylesRegistry.addThemes` function.
                </Text>
                <Text style={styles.text}>
                    Both are special, because they use reserved `light` and `dark` names. If you want to use adaptive mode,
                    you need to set it explicitly in `UnistylesRegistry.addConfig` function.
                </Text>
                <Text style={styles.text}>
                    Otherwise, you need to pick the theme with `useInitialTheme` hook or during registry with `UnistylesRegistry.addConfig` function.
                </Text>
                <Text style={styles.text}>
                    Your phone color scheme is {UnistylesRuntime.colorScheme}.
                </Text>
                <Text style={styles.text}>
                    Selected theme is {UnistylesRuntime.themeName}.
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
