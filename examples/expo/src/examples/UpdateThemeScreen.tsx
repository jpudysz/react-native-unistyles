import React from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'

export const UpdateThemeScreen: React.FunctionComponent = () => {
    // UnistylesRuntime offers a way to update your theme at runtime
    // if the currently selected theme is updated, it will cause a re-render
    const { styles, theme } = useStyles(stylesheet)
    const renderCount = React.useRef(1)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen demonstrates how to update theme in runtime.
                </Text>
                <Text style={styles.text}>
                    Current theme: {UnistylesRuntime.themeName}
                </Text>
                <Text style={styles.theme}>
                    Colors: {JSON.stringify(theme.colors, null, 2)}
                </Text>
                <Text style={styles.text}>
                    Number of re-renders: {renderCount.current++}
                </Text>
                <Button
                    title="Update light theme"
                    onPress={() => {
                        // toggle between black and red typography
                        UnistylesRuntime.updateTheme('light', theme => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                typography: theme.colors.typography === '#000000'
                                    ? theme.colors.blood
                                    : '#000000'
                            }
                        }))
                    }}
                />
                <Button
                    title="Update dark theme"
                    onPress={() => {
                        // toggle between black and green typography
                        UnistylesRuntime.updateTheme('dark', theme => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                typography: theme.colors.typography === '#ffffff'
                                    ? theme.colors.aloes
                                    : '#ffffff'
                            }
                        }))
                    }}
                />
                <Button
                    title="Switch themes"
                    onPress={() => {
                        UnistylesRuntime.setTheme(UnistylesRuntime.themeName === 'light' ? 'dark' : 'light')
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
    },
    theme: {
        color: theme.colors.typography
    }
}))
