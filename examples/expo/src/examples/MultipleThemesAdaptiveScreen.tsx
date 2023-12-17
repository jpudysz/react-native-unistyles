import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

export const MultipleThemesAdaptiveScreen: React.FunctionComponent = () => {
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
