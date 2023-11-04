import React from 'react'
import { Button, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRegistry, UnistylesRuntime } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { darkTheme, lightTheme, premiumTheme } from '../styles'
import { useLazyRegistryForDemo } from '../hooks'

export const MultipleThemesAdaptiveScreen: React.FunctionComponent = () => {
    useLazyRegistryForDemo(() => {
        UnistylesRegistry
            .addThemes({
                light: lightTheme,
                dark: darkTheme,
                premium: premiumTheme
            })
            .addConfig({
                adaptiveThemes: true
            })
    })

    const { styles, theme  } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has three themes registered with `UnistylesRegistry.addThemes` function.
                </Text>
                <Text style={styles.text}>
                    Also, we enabled adaptive mode with `UnistylesRegistry.addConfig` function.
                </Text>
                <Text style={styles.text}>
                    By default Unistyles will select theme based on user's device settings.
                </Text>
                <Button
                    color={theme.colors.accent}
                    title="Toggle adaptive mode"
                    onPress={() => {
                        UnistylesRuntime.setAdaptiveThemes(!UnistylesRuntime.hasAdaptiveThemes)
                    }}
                />
                <Button
                    color={theme.colors.accent}
                    title="Switch to other theme and check how it bahaves"
                    onPress={() => {
                        switch (UnistylesRuntime.themeName) {
                            case 'light': {
                                return UnistylesRuntime.setTheme('dark')
                            }
                            case 'dark': {
                                return UnistylesRuntime.setTheme('premium')
                            }
                            default:
                            case 'premium': {
                                return UnistylesRuntime.setTheme('light')
                            }
                        }
                    }}
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
