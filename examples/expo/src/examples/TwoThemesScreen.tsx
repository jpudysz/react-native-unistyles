import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime, useInitialTheme } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

export const TwoThemesScreen: React.FunctionComponent = () => {
    // if you have 2 or more themes, you need to select one of them
    // keep in mind that everything is synchronous and so fast, that you can set it in the same screen 🔥
    // two more notes:
    // call it before useStyles
    // if you won't do that you will get UNISTYLES_THEME_NOT_FOUND error
    useInitialTheme('premium')

    // you can also skip useInitialTheme and set the theme during UnistylesRegistry.addConfig({}) call

    const { styles, theme } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has two themes registered with `UnistylesRegistry.addThemes` function.
                </Text>
                <Text style={styles.text}>
                    It also shows a way to switch the theme from anywhere of your app. You can do that importing `UnistylesRuntime` and calling `setTheme` function.
                </Text>
                <Text style={styles.text}>
                    This screen uses {UnistylesRuntime.themeName} theme.
                </Text>
                <Button
                    title="Switch theme"
                    color={theme.colors.accent}
                    onPress={() => UnistylesRuntime.setTheme(UnistylesRuntime.themeName === 'light' ? 'premium' : 'light')}
                />
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
