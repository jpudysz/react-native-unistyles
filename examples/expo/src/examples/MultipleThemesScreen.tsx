import React from 'react'
import { Button, Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime, useInitialTheme } from 'react-native-unistyles'
import { DemoScreen } from '../components'

export const MultipleThemesScreen: React.FunctionComponent = () => {
    // if you have multiple themes, you need to select one of them
    useInitialTheme('premium')

    const { styles, theme  } = useStyles(stylesheet)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has three themes registered with `UnistylesRegistry.addThemes` function.
                </Text>
                <Text style={styles.text}>
                    To be fair, there is no limit on how many themes you can register...
                </Text>
                <Text style={styles.text}>
                    Selected theme is {UnistylesRuntime.themeName}.
                </Text>
                <Button
                    color={theme.colors.accent}
                    title="Switch to other theme"
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
