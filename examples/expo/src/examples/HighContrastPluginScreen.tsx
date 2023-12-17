import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { createStyleSheet, useStyles, UnistylesRuntime } from 'react-native-unistyles'
import { Button, DemoScreen } from '../components'
import { highContrastPlugin } from '../plugins'

export const HighContrastPluginScreen: React.FunctionComponent = () => {
    const { styles, theme } = useStyles(stylesheet)

    useEffect(() => {
        // plugins can be runtime enabled/disabled
        // it will cause re-render of the stylesheets
        UnistylesRuntime.addPlugin(highContrastPlugin)

        return () => {
            UnistylesRuntime.removePlugin(highContrastPlugin)
        }
    }, [])

    // check if plugin is enabled with runtime
    const isHighContrastPluginEnabled = UnistylesRuntime
        .enabledPlugins
        .includes(highContrastPlugin.name)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <Text style={styles.text}>
                    This screen has a enabled High Contrast plugin
                </Text>
                <Text style={styles.text}>
                    It will automatically change your theme colors to high contrast
                </Text>
                <View style={styles.circle} />
                <Button
                    textColor={theme.colors.typography}
                    title={isHighContrastPluginEnabled ? 'Disable high contrast' : 'Enable high contrast'}
                    color={theme.colors.backgroundColor}
                    onPress={() => {
                        isHighContrastPluginEnabled
                            ? UnistylesRuntime.removePlugin(highContrastPlugin)
                            : UnistylesRuntime.addPlugin(highContrastPlugin)
                    }}
                />
                <Button
                    title="Change theme"
                    textColor={theme.colors.typography}
                    color={theme.colors.backgroundColor}
                    onPress={() => {
                        switch (UnistylesRuntime.themeName) {
                            case 'light':
                                return UnistylesRuntime.setTheme('dark')
                            case 'dark':
                                return UnistylesRuntime.setTheme('premium')
                            case 'premium':
                            default:
                                return UnistylesRuntime.setTheme('light')
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
        rowGap: 10,
        backgroundColor: theme.colors.backgroundColor
    },
    text: {
        textAlign: 'center',
        color: theme.colors.typography
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.accent
    }
}))
